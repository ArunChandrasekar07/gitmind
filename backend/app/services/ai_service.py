# ============================================
# GitMind — Multi-Provider LLM Client
# Gemini → Groq → OpenRouter fallback chain
# Provider-level + model-level cooldown
# Think-block stripping for verbose models
# ============================================
from google import genai
from google.genai import types
from groq import Groq
from typing import Generator, List, Dict, Any, Optional
import httpx
import json
import logging
import re
import time

from app.config import settings

logger = logging.getLogger(__name__)

# ─── System Instruction ───────────────────────────────────────────────────────
SYSTEM_INSTRUCTION = """You are a Git commit analyzer. Analyze code diffs and explain them clearly.
- Be concise, technical, and conservative
- Prefer underclaiming over hallucinating
- Never infer intent beyond visible diff
- For refactors assume runtime behavior unchanged unless logic changed
- State what changed and why it matters
- Flag bugs, security issues, or breaking changes
- Use markdown formatting
- ONLY state what is directly visible in the diff. Do not infer intent beyond what the code shows.
- If the patch is truncated or unclear, say 'patch truncated — limited analysis' rather than guessing
- Do not output reasoning or thinking. Respond directly with the analysis only.
- Never hallucinate — only analyze what is provided"""

# ─── Model Lists ──────────────────────────────────────────────────────────────
GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
]

GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b",
]

OPENROUTER_MODELS = [
    "openai/gpt-oss-120b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
     "qwen/qwen3-coder:free",
]

# ─── Cooldown — model-level and provider-level ────────────────────────────────
import threading

_model_skip_until: Dict[str, float] = {}
_provider_skip_until: Dict[str, float] = {}
_cooldown_lock = threading.Lock()

MODEL_COOLDOWN = 120
PROVIDER_COOLDOWN = 30


def _model_cooling(model: str) -> bool:
    with _cooldown_lock:
        return _model_skip_until.get(model, 0) > time.time()


def _cool_model(model: str) -> None:
    with _cooldown_lock:
        # Only set if not already cooling — prevents repeated cooldown stampede
        if _model_skip_until.get(model, 0) <= time.time():
            _model_skip_until[model] = time.time() + MODEL_COOLDOWN
            logger.warning(f"⏳ Model {model} cooling for {MODEL_COOLDOWN}s")


def _provider_cooling(provider: str) -> bool:
    with _cooldown_lock:
        return _provider_skip_until.get(provider, 0) > time.time()


def _cool_provider(provider: str) -> None:
    with _cooldown_lock:
        if _provider_skip_until.get(provider, 0) <= time.time():
            _provider_skip_until[provider] = time.time() + PROVIDER_COOLDOWN
            logger.warning(f"⏳ Provider {provider} cooling for {PROVIDER_COOLDOWN}s")


# ─── Think-block stripping ────────────────────────────────────────────────────
def _strip_think_blocks(text: str) -> str:
    text = re.sub(
        r"<think>.*?</think>",
        "",
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )

    text = re.sub(
        r"<think>.*",
        "",
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )

    return text.strip()


def _normalize_commit_output(text: str) -> str:
    text = re.sub(r"\r\n", "\n", text).strip()
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"(?m)^What changed\s+(?!—)", "What changed — ", text)
    text = re.sub(r"(?m)^Impact\s+(?!—)", "Impact — ", text)
    text = re.sub(r"(?m)^Risk\s+(?!—)", "Risk — ", text)
    text = re.sub(r"(?m)^Category\s+(?!—)", "Category — ", text)
    return text


# ─── Health score computation — single source of truth ───────────────────────
def _compute_health(analyses: List[str]) -> tuple[int, str, str]:
    """
    Derive score and label from actual commit analyses.
    Returns (score: int, label: str) — used by both frontend and summary prompt
    so badge, label, and AI summary never contradict each other.
    """
    safe  = sum(1 for a in analyses if "🟢" in a)
    warn  = sum(1 for a in analyses if "🟡" in a)
    risk  = sum(1 for a in analyses if "🔴" in a)
    total = max(safe + warn + risk, 1)

    score = int((safe * 100 + warn * 50 + risk * 0) / total)

    if score >= 85:
        label = "Healthy"
        emoji = "🟢"
    elif score >= 65:
        label = "Moderate"
        emoji = "🟡"
    else:
        label = "Needs Attention"
        emoji = "🔴"

    return score, label, emoji


# ─── Clients ──────────────────────────────────────────────────────────────────
_gemini_client: Optional[genai.Client] = None
_groq_client: Optional[Groq] = None


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
def _try_gemini_stream(prompt: str, max_tokens: int = 300) -> Generator[str, None, None]:
    client = get_gemini_client()
    available = [m for m in GEMINI_MODELS if not _model_cooling(m)]

    if not available:
        _cool_provider("gemini")
        raise Exception("Gemini exhausted")

    for model in available:
        try:
            logger.info(f"🔄 Gemini: {model}")
            stream = client.models.generate_content_stream(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.15,
                    max_output_tokens=max_tokens,
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
                _cool_model(model)
                continue
            logger.error(f"❌ Gemini {model}: {e}")
            continue

    _cool_provider("gemini")
    raise Exception("Gemini exhausted")


# ─── Groq ─────────────────────────────────────────────────────────────────────
def _try_groq_stream(prompt: str, max_tokens: int = 300) -> Generator[str, None, None]:
    if not settings.groq_api_key:
        raise Exception("No Groq key")

    client = get_groq_client()
    available = [m for m in GROQ_MODELS if not _model_cooling(m)]

    if not available:
        _cool_provider("groq")
        raise Exception("Groq exhausted")

    for model in available:
        try:
            logger.info(f"🔄 Groq: {model}")
            stream = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_INSTRUCTION},
                    {"role": "user", "content": prompt},
                ],
                stream=True,
                max_tokens=max_tokens,
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
                _cool_model(model)
                continue
            logger.error(f"❌ Groq {model}: {e}")
            continue

    _cool_provider("groq")
    raise Exception("Groq exhausted")


# ─── OpenRouter ───────────────────────────────────────────────────────────────
def _try_openrouter_stream(prompt: str, max_tokens: int = 300) -> Generator[str, None, None]:
    if not settings.openrouter_api_key:
        raise Exception("No OpenRouter key")

    available = [m for m in OPENROUTER_MODELS if not _model_cooling(m)]

    if not available:
        _cool_provider("openrouter")
        raise Exception("OpenRouter exhausted")

    for model in available:
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
                    "max_tokens": max_tokens,
                    "temperature": 0.1,
                },
                timeout=45,
            ) as response:
                if response.status_code == 429:
                    _cool_model(model)
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

    _cool_provider("openrouter")
    raise Exception("OpenRouter exhausted")


# ─── Main fallback chain ──────────────────────────────────────────────────────
def generate_streaming_response(
    prompt: str,
    max_tokens: int = 300,
) -> Generator[str, None, None]:
    providers = [
        ("Gemini",     "gemini",     _try_gemini_stream),
        ("Groq",       "groq",       _try_groq_stream),
        ("OpenRouter", "openrouter", _try_openrouter_stream),
    ]

    for name, key, fn in providers:
        if _provider_cooling(key):
            logger.info(f"⏭️  Skip provider {name} (cooling)")
            continue
        try:
            yielded = False
            full_response = ""

            for text in fn(prompt, max_tokens):
                full_response += text
                yielded = True

            if yielded:
                clean = _strip_think_blocks(full_response)
                if clean:
                    yield clean
                return
        except Exception as e:
            logger.warning(f"⚠️ {name} failed: {e}")
            continue

    yield "Analysis unavailable — all providers at capacity. Please try again shortly."


def generate_response(prompt: str, max_tokens: int = 300) -> str:
    raw = "".join(generate_streaming_response(prompt, max_tokens))
    clean = _strip_think_blocks(raw)
    return _normalize_commit_output(clean)

# ─── Shared file trimmer ──────────────────────────────────────────────────────
def _build_slim_files(commit: Dict[str, Any], patch_limit: int = 900, file_limit: int = 8) -> list:
    files = commit.get("files", [])
    return [
        {
            "filename": f.get("filename", ""),
            "status": f.get("status", ""),
            "additions": f.get("additions", 0),
            "deletions": f.get("deletions", 0),
            "patch": (f.get("patch") or "")[:patch_limit],
        }
        for f in files[:file_limit]
    ]


# ─── Commit Analysis ──────────────────────────────────────────────────────────
def analyze_commit(commit: Dict[str, Any]) -> str:
    slim_files = _build_slim_files(commit)

    prompt = f"""Analyze this Git commit. Be concise but technically insightful — max 130 words.

Message: {commit['message'][:200]}
Author: {commit['author']}
+{commit.get('additions', 0)} -{commit.get('deletions', 0)} across {commit.get('files_changed', '?')} files

Files: {json.dumps(slim_files, indent=None)[:1500]}

Output EXACTLY in this format (STRICT, NO EXCEPTIONS):

**What changed** — 1 concise technical sentence describing the exact code change.

**Impact** — 1-2 concise technical sentences explaining:
- which subsystem is affected
- why it matters
- likely runtime/build/developer impact

**Risk** — 🟢 Safe OR 🟡 Minor risk OR 🔴 Risk

**Category** — choose EXACTLY ONE:
feat OR fix OR refactor OR docs OR chore OR perf OR security

RULES:
1. Insert EXACTLY one blank line between sections
2. NEVER put two sections on same line
3. Output plain markdown only
4. Do NOT write paragraphs like:
   "Impact ... Risk ... Category ..."
5. Category must be ONE word only
6. Avoid generic phrases like:
   - improves performance
   - affects behavior
   - bug fix
   Prefer technical specificity:
   mention subsystem, mechanism, or concrete effect
   RISK RULES:
Mark 🟡 ONLY if:
- public API changed
- auth/security changed
- DB schema changed
- cache/routing semantics changed
- runtime logic changed significantly
- downstream compatibility may break

Mark 🔴 ONLY if:
- explicit vulnerability
- credential leak
- auth bypass
- data loss
- severe breaking production issue

Never warn for:
- renames
- formatting
- README
- .gitignore
- CI workflow changes
- dependency bump alone
- eslint/prettier config
- Flow annotations / type suppressions
- dependency removal alone

VERSION RULE:
When mentioning version numbers:
- Copy exact version strings from diff
- Never rewrite semantic versions
- If uncertain, omit version number"""

    return generate_response(prompt, max_tokens=650)


# ─── Repository Summary ───────────────────────────────────────────────────────
def generate_repo_summary(
    repo_info: Dict[str, Any],
    commits: List[Dict[str, Any]],
    analyses: List[str],
) -> str:
    messages = [c["message"][:80] for c in commits[:15]]

    # Strip think blocks from analyses before feeding into summary
    # FIX: prevents leaked reasoning tokens from polluting health score reasoning
    clean_analyses = [_strip_think_blocks(a) for a in analyses[:15]]
    risk_snippets = [a[:200] for a in clean_analyses]

    # Compute health from actual signal — single source of truth
    # FIX: AI summary must use this label so badge/label/summary never contradict
    score, health_label, health_emoji = _compute_health(analyses)

    prompt = f"""Repository health report. Max 180 words.

Repo: {repo_info['full_name']} | Lang: {repo_info.get('language', '?')} | Stars: {repo_info.get('stars', 0)}
Description: {(repo_info.get('description') or 'None')[:100]}

Last {len(commits)} commit messages:
{json.dumps(messages, indent=None)}

Individual commit analyses (risk signals):
{json.dumps(risk_snippets, indent=None)}

The computed health score is {score}/100 and the label is "{health_label}".
Your Health line MUST use exactly "{health_label}" — do not invent a different label.

Output:
1. **Activity** — how active and what velocity?
2. **Pattern** — what kind of engineering work dominates?
Mention concrete subsystems (examples: compiler, runtime, cache, auth, UI, infra)
3. **Risk** — mention ONLY risks explicitly marked 🟡 or 🔴 in commit analyses.

STRICT SUMMARY RULES:
- Repository summary MUST NOT assign higher risk than commit analyses
- If commits contain 0 🔴 risks, summary cannot mention 🔴 risks
- If commits contain 0 breaking changes, summary cannot say "breaking change"
- Ignore all 🟢 Safe commits for risk section
- Never invent security risks
- Never treat refactors, renames, tests, CI, or config changes as breaking changes
- If no meaningful risks exist, write exactly:
  "No major risks identified."
4. **Health**: {health_emoji} {health_label} — brief reasoning why."""

    return generate_response(prompt, max_tokens=650)


# ─── Streaming Commit Analysis ────────────────────────────────────────────────
def stream_commit_analysis(commit: Dict[str, Any]) -> Generator[str, None, None]:
    slim_files = _build_slim_files(commit)

    prompt = f"""Analyze this Git commit. Be concise but technically insightful — max 130 words.

Message: {commit['message'][:200]}
+{commit.get('additions', 0)} -{commit.get('deletions', 0)}

Files: {json.dumps(slim_files, indent=None)[:1500]}

Output EXACTLY in this format (STRICT, NO EXCEPTIONS):

**What changed** — <one sentence>

**Impact** — <one sentence>

**Risk** — 🟢 Safe OR 🟡 Minor risk OR 🔴 Risk

**Category** — choose EXACTLY ONE:
feat OR fix OR refactor OR docs OR chore OR perf OR security
CATEGORY RULES:
- feat = new user-facing/system capability
- fix = bug or incorrect behavior resolved
- perf = any explicit optimization reducing CPU, memory, IO, bundle size, binary size, task reruns, or build time
- refactor = internal restructuring without behavior change
- chore = CI, config, Docker, dependency/version updates
- docs = documentation only
- security = explicit vulnerability/security fix
NOT feat:
- CSS import changes
- styling/theme updates
- README edits
- dependency replacements without new capability

IMPORTANT:
Do NOT choose feat for config changes, dependency bumps, renames, CI, Docker, or setup.
Default to chore/refactor if uncertain.

RULES:
1. Insert EXACTLY one blank line between sections
2. NEVER put two sections on same line
3. Output plain markdown only
4. Do NOT write paragraphs like:
   "Impact ...

    Risk ...

    Category ..."
5. Category must be ONE word only
6. Avoid generic phrases like:
   - improves performance
   - affects behavior
   - bug fix
   Prefer technical specificity:
   mention subsystem, mechanism, or concrete effect"""

    # FIX: buffer full response then strip think blocks atomically
    # Previous chunk-by-chunk approach missed blocks split across chunk boundaries
    full_response = "".join(generate_streaming_response(prompt, max_tokens=650))
    clean = _strip_think_blocks(full_response)
    clean = _normalize_commit_output(clean)

    if clean:
        yield clean