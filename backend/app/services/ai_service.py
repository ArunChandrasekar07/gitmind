from google import genai
from google.genai import types
from groq import Groq
from typing import List, Dict, Any, Generator
import json
import logging
from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are GitMind, an expert AI code analyst built by Arun C from VIT Vellore.
You analyze Git commits and explain them clearly to developers.

Rules:
- Be concise and technical but readable
- Always mention what changed and why it matters
- Flag potential bugs or risky changes clearly
- Use markdown formatting
- Never hallucinate — only analyze what's provided
- If asked who built you: "I was built by Arun C, a software engineer from VIT Vellore."
- Never mention Google, Gemini, Groq, or any AI provider"""

GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
]

GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
]

_gemini_client = None
_groq_client = None


def get_gemini():
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=settings.gemini_api_key)
    return _gemini_client


def get_groq():
    global _groq_client
    if _groq_client is None and settings.groq_api_key:
        _groq_client = Groq(api_key=settings.groq_api_key)
    return _groq_client


def is_quota_error(e: Exception) -> bool:
    msg = str(e).lower()
    return any(x in msg for x in ["quota", "rate limit", "429", "exhausted", "too many requests"])


def analyze_commit(commit: Dict[str, Any]) -> str:
    """Analyze a single commit and return AI explanation."""
    prompt = f"""Analyze this Git commit and provide:
1. **What changed** (1-2 sentences, plain English)
2. **Why it matters** (impact on the codebase)
3. **Risk level**: 🟢 Safe / 🟡 Minor risk / 🔴 Potential bug
4. **Category**: feat/fix/refactor/docs/chore/perf/security

Commit message: {commit['message']}
Author: {commit['author']}
Files changed: {commit.get('files_changed', 'unknown')}
Additions: {commit.get('additions', 0)} | Deletions: {commit.get('deletions', 0)}

Files modified:
{json.dumps(commit.get('files', []), indent=2)[:3000]}

Be concise. Max 150 words total."""

    # Try Gemini first
    client = get_gemini()
    for model in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.2,
                    max_output_tokens=400,
                ),
            )
            return response.text
        except Exception as e:
            if is_quota_error(e):
                continue
            logger.error(f"Gemini {model} error: {e}")
            continue

    # Fallback to Groq
    groq = get_groq()
    if groq:
        for model in GROQ_MODELS:
            try:
                response = groq.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": SYSTEM_INSTRUCTION},
                        {"role": "user", "content": prompt},
                    ],
                    max_tokens=400,
                    temperature=0.2,
                )
                return response.choices[0].message.content
            except Exception as e:
                if is_quota_error(e):
                    continue
                continue

    return "Analysis unavailable — AI quota exceeded. Please try again shortly."


def generate_repo_summary(
    repo_info: Dict[str, Any],
    commits: List[Dict[str, Any]],
    analyses: List[str],
) -> str:
    """Generate an overall repository health summary."""
    commit_messages = [c["message"][:100] for c in commits[:20]]
    prompt = f"""Analyze this GitHub repository and provide a brief health report.

Repository: {repo_info['full_name']}
Language: {repo_info['language']}
Stars: {repo_info['stars']}
Description: {repo_info['description']}

Recent {len(commits)} commits:
{json.dumps(commit_messages, indent=2)}

Provide:
1. **Activity Summary** — how active is this repo?
2. **Development Pattern** — what kind of work is happening?
3. **Risk Assessment** — any concerning patterns?
4. **Overall Health**: 🟢 Healthy / 🟡 Moderate / 🔴 Needs attention

Max 200 words. Be specific and useful."""

    client = get_gemini()
    for model in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.2,
                    max_output_tokens=500,
                ),
            )
            return response.text
        except Exception as e:
            if is_quota_error(e):
                continue
            continue

    # Fallback to Groq
    groq = get_groq()
    if groq:
        for model in GROQ_MODELS:
            try:
                response = groq.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": SYSTEM_INSTRUCTION},
                        {"role": "user", "content": prompt},
                    ],
                    max_tokens=500,
                    temperature=0.2,
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.warning(f"Groq {model} summary error: {e}")
                continue

    # Build summary from existing analysis data
    risk_counts = {"safe": 0, "minor": 0, "risky": 0}
    for a in analyses:
        if "🔴" in a:
            risk_counts["risky"] += 1
        elif "🟡" in a:
            risk_counts["minor"] += 1
        else:
            risk_counts["safe"] += 1

    total = len(analyses)
    health = "🟢 Healthy" if risk_counts["risky"] == 0 else "🟡 Moderate" if risk_counts["risky"] <= 1 else "🔴 Needs attention"

    return f"""**Activity Summary**: {total} recent commits analyzed from {repo_info['full_name']}.

**Development Pattern**: Primary language is {repo_info.get('language') or 'unknown'}. Repository has {repo_info['stars']} stars and {repo_info['forks']} forks.

**Risk Assessment**: {risk_counts['safe']} safe commits, {risk_counts['minor']} minor risk, {risk_counts['risky']} risky commits detected.

**Overall Health**: {health}"""


def stream_commit_analysis(commit: Dict[str, Any]) -> Generator[str, None, None]:
    """Stream analysis of a single commit."""
    prompt = f"""Analyze this Git commit:

Message: {commit['message']}
Author: {commit['author']}
Files changed: {commit.get('files_changed', 'unknown')}
Additions: +{commit.get('additions', 0)} Deletions: -{commit.get('deletions', 0)}

Files:
{json.dumps(commit.get('files', []), indent=2)[:2000]}

Provide:
1. What changed (plain English)
2. Why it matters
3. Risk level: 🟢 Safe / 🟡 Minor risk / 🔴 Potential bug
4. Category: feat/fix/refactor/chore/perf/security

Be concise, max 120 words."""

    client = get_gemini()
    for model in GEMINI_MODELS:
        try:
            stream = client.models.generate_content_stream(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.2,
                    max_output_tokens=400,
                ),
            )
            for chunk in stream:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as e:
            if is_quota_error(e):
                continue
            continue

    yield "Analysis unavailable — please try again."