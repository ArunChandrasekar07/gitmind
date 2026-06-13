# ============================================
# GitMind — Multi-Provider LLM Client
# Gemini → Groq → OpenRouter fallback chain
# Smart cooldown — skips rate-limited models
# ============================================
from google import genai
from google.genai import types
from groq import Groq
from typing import Generator, List, Dict, Any
import httpx
import json
import logging
import time

from app.config import settings

logger = logging.getLogger(__name__)

# ─── System Instruction ───────────────────────────────────────────────────────
SYSTEM_INSTRUCTION = """You are a Git commit analyzer. Analyze code diffs and explain them clearly.
- Be concise and technical
- State what changed and why it matters
- Flag bugs, security issues, or breaking changes
- Use markdown formatting
- Never hallucinate — only analyze what is provided"""

# ─── Model Lists — fastest/cheapest first ─────────────────────────────────────
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
]

GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b",
    "llama-3.1-8b-instant",
]

OPENROUTER_MODELS = [
    "google/gemini-2.5-flash",
    "openai/gpt-oss-120b:free",
    "qwen/qwen3-coder:free",
    "meta-llama/llama-3.3-70b-instruct:free",
]

# ─── Cooldown tracker — skips models that hit 429 for 120s ────────────────────
_skip_until: Dict[str, float] = {}
COOLDOWN = 60  # seconds


def _is_cooling(model: str) -> bool:
    return _skip_until.get(model, 0) > time.time()


def _cool(model: str) -> None:
    _skip_until[model] = time.time() + COOLDOWN
    logger.warning(f"⏳ {model} cooling for {COOLDOWN}s")


# ─── Clients ──────────────────────────────────────────────────────────────────
_gemini_client = None
_groq_client = None


def get_gemini_client() -> genai.Client:
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=settings.gemini_api_key)
    return _gemini_client


def get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(
    api_key=settings.groq_api_key,
    max_retries=0,
    )
    return _groq_client


def is_quota_error(e: Exception) -> bool:
    msg = str(e).lower()
    return any(x in msg for x in [
    "quota",
    "rate limit",
    "429",
    "503",
    "unavailable",
    "high demand",
    "exhausted",
    "too many requests",
    "resource_exhausted",
])


# ─── Gemini ───────────────────────────────────────────────────────────────────
def _try_gemini_stream(prompt: str) -> Generator[str, None, None]:
    client = get_gemini_client()
    for model in GEMINI_MODELS:
        if _is_cooling(model):
            logger.info(f"⏭️  Skip {model} (cooling)")
            continue
        try:
            logger.info(f"🔄 Gemini: {model}")
            stream = client.models.generate_content_stream(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.1,
                    max_output_tokens=600,
                ),
            )
            chunks = 0
            for chunk in stream:
                if chunk.text:
                    yield chunk.text
                    chunks += 1
            if chunks > 0:
                logger.info(f"✅ Gemini {model}: {chunks} chunks")
                return
        except Exception as e:
            if is_quota_error(e):
                _cool(model)
                continue
            logger.error(f"❌ Gemini {model}: {e}")
            continue
    raise Exception("Gemini exhausted")


# ─── Groq ─────────────────────────────────────────────────────────────────────
def _try_groq_stream(prompt: str) -> Generator[str, None, None]:
    if not settings.groq_api_key:
        raise Exception("No Groq key")
    client = get_groq_client()
    for model in GROQ_MODELS:
        if _is_cooling(model):
            logger.info(f"⏭️  Skip {model} (cooling)")
            continue
        try:
            logger.info(f"🔄 Groq: {model}")
            stream = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_INSTRUCTION},
                    {"role": "user", "content": prompt},
                ],
                stream=True,
                max_tokens=600,
                temperature=0.1,
            )
            chunks = 0
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text:
                    yield text
                    chunks += 1
            if chunks > 0:
                logger.info(f"✅ Groq {model}: {chunks} chunks")
                return
        except Exception as e:
            if is_quota_error(e):
                _cool(model)
                continue
            logger.error(f"❌ Groq {model}: {e}")
            continue
    raise Exception("Groq exhausted")


# ─── OpenRouter ───────────────────────────────────────────────────────────────
def _try_openrouter_stream(prompt: str) -> Generator[str, None, None]:
    if not settings.openrouter_api_key:
        raise Exception("No OpenRouter key")
    for model in OPENROUTER_MODELS:
        if _is_cooling(model):
            logger.info(f"⏭️  Skip {model} (cooling)")
            continue
        try:
            logger.info(f"🔄 OpenRouter: {model}")
            with httpx.stream(
                "POST",
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://gitmind.vercel.app",
                    "X-Title": "GitMind",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_INSTRUCTION},
                        {"role": "user", "content": prompt},
                    ],
                    "stream": True,
                    "max_tokens": 600,
                    "temperature": 0.1,
                },
                timeout=25,
            ) as response:
                if response.status_code == 429:
                    _cool(model)
                    continue
                if response.status_code != 200:
                    logger.warning(f"⚠️ OpenRouter {model}: {response.status_code}")
                    continue
                chunks = 0
                for line in response.iter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            obj = json.loads(data)
                            text = obj["choices"][0]["delta"].get("content", "")
                            if text:
                                yield text
                                chunks += 1
                        except Exception:
                            continue
                if chunks > 0:
                    logger.info(f"✅ OpenRouter {model}: {chunks} chunks")
                    return
        except Exception as e:
            logger.warning(f"⚠️ OpenRouter {model}: {e}")
            continue
    raise Exception("OpenRouter exhausted")


# ─── Main fallback chain ──────────────────────────────────────────────────────
def generate_streaming_response(prompt: str) -> Generator[str, None, None]:
    for name, fn in [
        ("Gemini", _try_gemini_stream),
        ("Groq", _try_groq_stream),
        ("OpenRouter", _try_openrouter_stream),
    ]:
        try:
            yielded = False
            for text in fn(prompt):
                yield text
                yielded = True
            if yielded:
                return
        except Exception as e:
            logger.warning(f"⚠️ {name} failed: {e}")
            continue

    yield "Analysis unavailable — all providers at capacity. Please try again shortly."


def generate_response(prompt: str) -> str:
    return "".join(generate_streaming_response(prompt))


# ─── Commit Analysis ──────────────────────────────────────────────────────────
def analyze_commit(commit: Dict[str, Any]) -> str:
    files = commit.get("files", [])
    # Trim patch data — only keep filename, status, line counts
    slim_files = [
        {
            "filename": f.get("filename", ""),
            "status": f.get("status", ""),
            "additions": f.get("additions", 0),
            "deletions": f.get("deletions", 0),
            # Only first 300 chars of patch
            "patch": (f.get("patch") or "")[:300],
        }
        for f in files[:8]
    ]

    prompt = f"""Analyze this Git commit. Be concise — max 100 words.

Message: {commit['message'][:200]}
Author: {commit['author']}
+{commit.get('additions', 0)} -{commit.get('deletions', 0)} across {commit.get('files_changed', '?')} files

Files: {json.dumps(slim_files, indent=None)[:1200]}

Output:
1. **What changed** (1 sentence)
2. **Impact** (1 sentence)
3. **Risk**: 🟢 Safe / 🟡 Minor risk / 🔴 Bug or security issue
4. **Category**: feat/fix/refactor/docs/chore/perf/security"""

    return generate_response(prompt)


# ─── Repository Summary ───────────────────────────────────────────────────────
def generate_repo_summary(
    repo_info: Dict[str, Any],
    commits: List[Dict[str, Any]],
    analyses: List[str],
) -> str:
    messages = [c["message"][:80] for c in commits[:15]]

    prompt = f"""Repository health report. Max 150 words.

Repo: {repo_info['full_name']} | Lang: {repo_info.get('language','?')} | Stars: {repo_info.get('stars',0)}
Description: {(repo_info.get('description') or 'None')[:100]}

Last {len(commits)} commits:
{json.dumps(messages, indent=None)}

Output:
1. **Activity** — how active?
2. **Pattern** — what kind of work?
3. **Risk** — any concerns?
4. **Health**: 🟢 Healthy / 🟡 Moderate / 🔴 Needs attention"""

    return generate_response(prompt)


# ─── Streaming Commit Analysis ────────────────────────────────────────────────
def stream_commit_analysis(commit: Dict[str, Any]) -> Generator[str, None, None]:
    files = commit.get("files", [])
    slim_files = [
        {
            "filename": f.get("filename", ""),
            "status": f.get("status", ""),
            "additions": f.get("additions", 0),
            "deletions": f.get("deletions", 0),
            "patch": (f.get("patch") or "")[:300],
        }
        for f in files[:8]
    ]

    prompt = f"""Analyze this Git commit. Max 100 words.

Message: {commit['message'][:200]}
+{commit.get('additions', 0)} -{commit.get('deletions', 0)}

Files: {json.dumps(slim_files, indent=None)[:1200]}

1. What changed (1 sentence)
2. Why it matters (1 sentence)
3. Risk: 🟢 Safe / 🟡 Minor risk / 🔴 Bug
4. Category: feat/fix/refactor/chore/perf/security"""

    yield from generate_streaming_response(prompt)