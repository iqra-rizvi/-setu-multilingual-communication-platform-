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

# IndicTrans2 / FLORES Language Codes
LANGUAGE_CODES = {
    "English": "eng_Latn",
    "Hindi": "hin_Deva",
    "Telugu": "tel_Telu",
    "Tamil": "tam_Taml",
    "Kannada": "kan_Knda",
    "Malayalam": "mal_Mlym",
    "Marathi": "mar_Deva",
    "Gujarati": "guj_Gujr",
    "Punjabi": "pan_Guru",
    "Bengali": "ben_Beng",
    "Odia": "ory_Orya",
    "Assamese": "asm_Beng",
    "Urdu": "urd_Arab",
    "Kashmiri": "kas_Arab",
    "Konkani": "gom_Deva",
    "Maithili": "mai_Deva",
    "Manipuri": "mni_Beng",
    "Nepali": "npi_Deva",
    "Sanskrit": "san_Deva",
    "Sindhi": "snd_Arab",
    "Dogri": "doi_Deva",
    "Bodo": "brx_Deva",
    "Santali": "sat_Olck",
}


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

    tone_instruction = {
        "friendly": (
            "Write in a warm, encouraging and conversational style. "
            "Make the reader feel welcomed and supported."
        ),

        "formal": (
            "Write in a professional, official government communication style. "
            "Use respectful and formal language."
        ),

        "urgent": (
            "Write with a strong sense of urgency. "
            "Encourage immediate action while remaining calm and responsible."
        ),

        "informative": (
            "Write clearly and factually. "
            "Focus on providing useful information and guidance."
        ),
    }

    system = """
You are an expert campaign content writer for government and public awareness organizations.

Your job is to create ONE high-quality campaign message.

Rules:
- Keep it between 80 and 120 words.
- Make the writing style noticeably match the requested tone.
- Don't use markdown.
- Don't add titles.
- Return only the campaign message.
"""

    prompt = f"""
Campaign Type:
{campaign_type}

Campaign Brief:
{brief}

Required Tone:
{tone}

Writing Style:
{tone_instruction.get(tone, tone_instruction["informative"])}

Generate the campaign message now.
"""

    try:
        return await _call_groq(system, prompt)

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
    "You are an AI4Bharat IndicTrans2 multilingual translation engine. "
    f"Translate the following public awareness message from English to {lang}. "
    f"Target language code: {LANGUAGE_CODES.get(lang, 'Unknown')}. "
    f"Preserve the original meaning exactly. "
    f"Maintain the '{tone}' tone. "
    "Use natural, grammatically correct public communication language. "
    "Do not summarize, explain, or add extra information. "
    "Return only the translated text."
)
        try:
            results[lang] = await _call_groq(system, content, max_tokens=500)
        except Exception:
            results[lang] = _mock_translate(content, lang)
    return results


def _mock_personalize(
    content: str,
    recipient_name: str,
    occupation: str,
    language: str,
    state: str,
    city: str,
) -> str:
    greeting = f"Dear {recipient_name}, " if recipient_name else ""

    details = []

    if occupation:
        details.append(f"Occupation: {occupation}")

    if city:
        details.append(f"City: {city}")

    if state:
        details.append(f"State: {state}")

    if language:
        details.append(f"Preferred Language: {language}")

    info = " | ".join(details)

    return f"{greeting}{content}\n\n[{info}]"

async def personalize_content(
    content: str,
    recipient_name: str,
    occupation: str,
    organization: str,
    language: str,
    state: str,
    city: str,
    engagement_score: float,
) -> str:

    if not GROQ_API_KEY:
        return _mock_personalize(
            content,
            recipient_name,
            occupation,
            language,
            state,
            city,
        )

    system = (
        "You are an AI assistant for multilingual public communication. "
        "Personalize the campaign message for the recipient while preserving its meaning. "
        "Use the recipient's language preference, occupation, organization, "
        "city, state and engagement level to make the message more relevant. "
        "Keep the tone professional and concise."
    )

    prompt = (
        f"Message:\n{content}\n\n"
        f"Recipient Name: {recipient_name}\n"
        f"Preferred Language: {language}\n"
        f"Occupation: {occupation}\n"
        f"Organization: {organization}\n"
        f"State: {state}\n"
        f"City: {city}\n"
        f"Engagement Score: {engagement_score}"
    )

    try:
        return await _call_groq(system, prompt, max_tokens=300)

    except Exception:
        return _mock_personalize(
            content,
            recipient_name,
            occupation,
            language,
            state,
            city,
        )


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
        result = _mock_sentiment(text)

        if result["label"] == "positive":
            result["suggested_tone"] = "Friendly"
            result["improved_message"] = text

        elif result["label"] == "negative":
            result["suggested_tone"] = "Empathetic"
            result["improved_message"] = (
                "We understand your concern. "
                + text +
                " Thank you for your patience and cooperation."
            )

        else:
            result["suggested_tone"] = "Informative"
            result["improved_message"] = text

        return result

    system = (
        "You are an AI communication quality assistant.\n"
        "Analyze the sentiment of the message.\n"
        "Suggest the most appropriate communication tone.\n"
        "Improve the wording while preserving the original meaning.\n\n"

        "Return ONLY valid JSON in this format:\n"

        '{'
        '"score":0.0,'
        '"label":"positive",'
        '"suggested_tone":"Friendly",'
        '"improved_message":"..."'
        '}'
    )

    try:

        raw = await _call_groq(system, text, max_tokens=300)

        cleaned = re.sub(r"```json|```", "", raw).strip()

        data = json.loads(cleaned)

        return {
            "score": float(data.get("score", 0)),
            "label": data.get("label", "neutral"),
            "suggested_tone": data.get("suggested_tone", "Informative"),
            "improved_message": data.get("improved_message", text),
        }

    except Exception:

        result = _mock_sentiment(text)

        result["suggested_tone"] = "Informative"
        result["improved_message"] = text

        return result


def check_compliance(content: str) -> Dict:
    """AI-powered content quality and compliance review."""

    lower = content.lower()

    violations = [term for term in BLOCKED_TERMS if term in lower]

    suggestions = []

    if len(content.split()) < 15:
        suggestions.append("Provide a little more detail for better clarity.")

    if len(content.split()) > 150:
        suggestions.append("Shorten the message for better readability.")

    if "!" in content:
        suggestions.append("Avoid excessive exclamation marks in official communications.")

    readability = "Good"

    if len(content.split()) > 120:
        readability = "Moderate"

    if len(content.split()) > 180:
        readability = "Poor"

    compliance_ok = len(violations) == 0 and len(content.strip()) > 0

    if not content.strip():
        notes = "Content is empty."

    elif violations:
        notes = f"Blocked terms found: {', '.join(violations)}"

    else:
        notes = "Content passed compliance review."

    return {
        "compliance_ok": compliance_ok,
        "compliance_notes": notes,
        "readability": readability,
        "suggestions": suggestions,
    }

async def chatbot_response(question: str) -> str:

    system = """
You are the official AI Assistant for the AI-Based Multilingual Mass Communication
& Public Awareness Management Platform.

Your purpose is to help users understand and use this platform.

Platform Overview:
- This platform helps organizations create and manage multilingual public awareness campaigns.
- AI is used to generate campaign content, translate messages, personalize communication, analyze sentiment, and monitor campaign performance.

Main Modules:
1. User Authentication
   - Register
   - Login
   - User Roles

2. Audience Management
   - Add audience
   - Import audience
   - Manage recipients
   - Language preferences

3. AI Content Generation
   - Generate campaign messages
   - Rewrite content
   - Improve communication

4. Multilingual Translation
   - Translate messages into Indian languages
   - Preserve meaning and tone

5. Campaign Distribution
   - Email
   - SMS
   - WhatsApp
   - Push Notifications
   - Web Notifications

6. Analytics Dashboard
   - Delivery Rate
   - Open Rate
   - Click Rate
   - Audience Reach
   - Channel Performance

Always:
- Answer clearly.
- Keep answers concise.
- Guide users step by step when they ask how to use a feature.
- If the question is unrelated to the platform, answer briefly and then return focus to the platform if appropriate.
- Never invent platform features that do not exist.
"""

    if not GROQ_API_KEY:
        return (
            "AI chatbot is running in demo mode. "
            "Please configure GROQ_API_KEY for intelligent responses."
        )

    try:
        return await _call_groq(system, question)

    except Exception:
        return "Sorry, I couldn't generate a response."