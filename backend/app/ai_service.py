"""
AI Service Layer
================
Wraps calls to an LLM (via the Groq API) for:
  - Campaign content generation
  - Multilingual translation (Indian languages)
  - Audience-specific personalization
  - Sentiment analysis / compliance check

If GROQ_API_KEY is not set in the environment, every function falls back
to a deterministic mock so the platform is fully demo-able without any keys
or billing setup. Swap in a real key to get true LLM-generated output with no
other code changes.

Get a free key at https://console.groq.com/keys
"""
import os
import json
import re
from typing import List, Dict

import httpx

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
# Groq-hosted model. Other options: "llama-3.1-8b-instant" (faster, cheaper),
# "mixtral-8x7b-32768". See https://console.groq.com/docs/models for the
# current list of supported models.
MODEL = "llama-3.3-70b-versatile"

INDIAN_LANGUAGE_SAMPLES = {
    "Hindi": "यह एक महत्वपूर्ण सूचना है।",
    "Tamil": "இது ஒரு முக்கியமான அறிவிப்பு.",
    "Bengali": "এটি একটি গুরুত্বপূর্ণ ঘোষণা।",
    "Telugu": "ఇది ఒక ముఖ్యమైన ప్రకటన.",
    "Marathi": "ही एक महत्त्वाची सूचना आहे.",
    "Gujarati": "આ એક મહત્વપૂર્ણ સૂચના છે.",
    "Kannada": "ಇದು ಒಂದು ಪ್ರಮುಖ ಪ್ರಕಟಣೆ.",
    "Malayalam": "ഇത് ഒരു പ്രധാന അറിയിപ്പാണ്.",
    "Punjabi": "ਇਹ ਇੱਕ ਮਹੱਤਵਪੂਰਨ ਸੂਚਨਾ ਹੈ।",
    "Odia": "ଏହା ଏକ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଘୋଷଣା।",
}

BLOCKED_TERMS = ["guaranteed cure", "100% risk-free", "hate", "violence"]


async def _call_groq(system: str, prompt: str, max_tokens: int = 800) -> str:
    """Low-level call to the Groq Chat Completions API (OpenAI-compatible). Raises on failure."""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(GROQ_URL, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


def _mock_generate(brief: str, tone: str) -> str:
    tone_prefix = {
        "urgent": "URGENT NOTICE: ",
        "friendly": "Hello! ",
        "formal": "This is an official communication. ",
        "informative": "",
    }.get(tone, "")
    return (
        f"{tone_prefix}{brief.strip().rstrip('.')}. "
        f"Please take note of this update and reach out to your local office "
        f"with any questions. Thank you for your attention."
    )


async def generate_content(brief: str, tone: str, campaign_type: str) -> str:
    if not GROQ_API_KEY:
        return _mock_generate(brief, tone)
    system = (
        "You are a public communications writer for government and civic "
        "organizations. Write clear, accessible campaign copy for mass "
        f"communication of type '{campaign_type}' with a '{tone}' tone. "
        "Keep it under 120 words, plain language, no markdown."
    )
    try:
        return await _call_groq(system, brief)
    except Exception:
        return _mock_generate(brief, tone)


def _mock_translate(content: str, language: str) -> str:
    sample = INDIAN_LANGUAGE_SAMPLES.get(language, content)
    return f"[{language}] {sample} ({content[:60]}...)" if len(content) > 60 else f"[{language}] {sample} ({content})"


async def translate_content(content: str, tone: str, languages: List[str]) -> Dict[str, str]:
    results = {}
    for lang in languages:
        if lang.lower() == "english":
            results[lang] = content
            continue
        if not GROQ_API_KEY:
            results[lang] = _mock_translate(content, lang)
            continue
        system = (
            f"You are a professional translator specializing in Indian languages. "
            f"Translate the given public communication into {lang}, preserving "
            f"the '{tone}' tone and meaning exactly. Return only the translation."
        )
        try:
            results[lang] = await _call_groq(system, content, max_tokens=500)
        except Exception:
            results[lang] = _mock_translate(content, lang)
    return results


def _mock_personalize(content: str, recipient_name: str, occupation: str) -> str:
    greeting = f"Dear {recipient_name}, " if recipient_name else ""
    context = f" (relevant to your role as {occupation})" if occupation else ""
    return f"{greeting}{content}{context}"


async def personalize_content(content: str, recipient_name: str, occupation: str, organization: str) -> str:
    if not GROQ_API_KEY:
        return _mock_personalize(content, recipient_name, occupation)
    system = (
        "Personalize the following public communication for a specific recipient. "
        "Keep the core message unchanged, add a natural greeting and, if relevant, "
        "one contextual reference to their role. Keep it concise."
    )
    prompt = (
        f"Message: {content}\n\nRecipient name: {recipient_name}\n"
        f"Occupation: {occupation}\nOrganization: {organization}"
    )
    try:
        return await _call_groq(system, prompt, max_tokens=300)
    except Exception:
        return _mock_personalize(content, recipient_name, occupation)


def _mock_sentiment(text: str) -> Dict:
    positive_words = ["good", "great", "thanks", "helpful", "excellent", "happy"]
    negative_words = ["bad", "angry", "delay", "problem", "issue", "worst", "unhappy"]
    t = text.lower()
    score = sum(w in t for w in positive_words) - sum(w in t for w in negative_words)
    score = max(-1.0, min(1.0, score / 3))
    label = "positive" if score > 0.15 else "negative" if score < -0.15 else "neutral"
    return {"score": round(score, 2), "label": label}


async def analyze_sentiment(text: str) -> Dict:
    if not GROQ_API_KEY:
        return _mock_sentiment(text)
    system = (
        "Analyze the sentiment of the given feedback text. Respond ONLY with "
        'valid JSON of the form {"score": <float -1 to 1>, "label": "positive|neutral|negative"}. '
        "No markdown, no preamble."
    )
    try:
        raw = await _call_groq(system, text, max_tokens=50)
        cleaned = re.sub(r"```json|```", "", raw).strip()
        parsed = json.loads(cleaned)
        return {"score": float(parsed.get("score", 0)), "label": parsed.get("label", "neutral")}
    except Exception:
        return _mock_sentiment(text)


def check_compliance(content: str) -> Dict:
    """Simple keyword-based compliance/quality check before deployment."""
    lower = content.lower()
    violations = [term for term in BLOCKED_TERMS if term in lower]
    ok = len(violations) == 0 and len(content.strip()) > 0
    notes = "Looks good." if ok else f"Flagged terms: {', '.join(violations)}" if violations else "Content is empty."
    return {"ok": ok, "notes": notes}
