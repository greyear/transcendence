import json
import logging
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from google import genai
from pydantic import BaseModel, Field, model_validator

logger = logging.getLogger(__name__)

app = FastAPI(title="translation-service", version="0.1.0")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_GEN_MODEL = os.getenv("GEMINI_GEN_MODEL", "gemini-2.5-flash")
SUPPORTED_LOCALES = ("en", "fi", "ru")
_generation_client: genai.Client | None = None


class TranslationRequest(BaseModel):
    source_language: str
    target_languages: list[str] = Field(default_factory=list)
    text: str | None = None
    texts: list[str] | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> "TranslationRequest":
        self.source_language = self.source_language.lower().strip()
        self.target_languages = [item.lower().strip() for item in self.target_languages]

        if self.source_language not in SUPPORTED_LOCALES:
            raise ValueError("source_language must be one of en, fi, ru")

        if not self.target_languages:
            raise ValueError("target_languages must not be empty")

        if any(locale not in SUPPORTED_LOCALES for locale in self.target_languages):
            raise ValueError("target_languages must contain only en, fi, ru")

        if self.source_language in self.target_languages:
            raise ValueError("target_languages must not include source_language")

        has_text = self.text is not None
        has_texts = self.texts is not None
        if has_text == has_texts:
            raise ValueError("provide exactly one of text or texts")

        if self.text is not None and not self.text.strip():
            raise ValueError("text must not be blank")

        if self.texts is not None:
            if not self.texts:
                raise ValueError("texts must not be empty")
            if any(not isinstance(item, str) or not item.strip() for item in self.texts):
                raise ValueError("texts must contain only non-blank strings")

        return self


def get_generation_client() -> genai.Client:
    global _generation_client

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured for translation-service",
        )

    if _generation_client is None:
        _generation_client = genai.Client(api_key=GEMINI_API_KEY)

    return _generation_client


def strip_json_fences(raw_text: str) -> str:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if len(lines) >= 3:
            cleaned = "\n".join(lines[1:-1]).strip()
    return cleaned


def generate_translation_payload(prompt: str) -> Any:
    try:
        response = get_generation_client().models.generate_content(
            model=GEMINI_GEN_MODEL,
            contents=prompt,
        )
    except Exception as error:
        logger.exception("Gemini translation request failed")
        raise HTTPException(
            status_code=503,
            detail="Failed to generate translations with Gemini",
        ) from error

    raw_text = (getattr(response, "text", None) or "").strip()
    if not raw_text:
        raise HTTPException(status_code=502, detail="Gemini returned empty translation payload")

    try:
        return json.loads(strip_json_fences(raw_text))
    except json.JSONDecodeError as error:
        logger.exception("Gemini translation payload was not valid JSON")
        raise HTTPException(
            status_code=502,
            detail="Gemini returned invalid translation JSON",
        ) from error


def build_single_prompt(
    source_language: str,
    target_languages: list[str],
    text: str,
) -> str:
    return "\n".join(
        [
            "You are a translation service for recipe content.",
            "Translate the input text from the source language to the listed target languages.",
            "Return strict JSON only.",
            "Use this exact shape:",
            '{"translations":{"en":"...","fi":"...","ru":"..."}}',
            "Include only the requested target languages inside translations.",
            "Do not include explanations, markdown, or extra keys.",
            f"source_language: {source_language}",
            f"target_languages: {', '.join(target_languages)}",
            f"text: {text}",
        ]
    )


def build_batch_prompt(
    source_language: str,
    target_languages: list[str],
    texts: list[str],
) -> str:
    numbered_texts = "\n".join(
        f"{index}. {value}" for index, value in enumerate(texts, start=1)
    )
    return "\n".join(
        [
            "You are a translation service for recipe content.",
            "Translate every input text from the source language to the listed target languages.",
            "Preserve the input order exactly.",
            "Return strict JSON only.",
            "Use this exact shape:",
            '{"translations":{"en":["..."],"fi":["..."],"ru":["..."]}}',
            "Include only the requested target languages as keys inside translations.",
            "Each target-language array must have exactly the same number of items as the input list.",
            "Do not include explanations, markdown, or extra keys.",
            f"source_language: {source_language}",
            f"target_languages: {', '.join(target_languages)}",
            "texts:",
            numbered_texts,
        ]
    )


def sanitize_translation_value(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip()
    return normalized or None


def sanitize_translation_list(value: Any, expected_count: int) -> list[str] | None:
    if not isinstance(value, list) or len(value) != expected_count:
        return None

    sanitized: list[str] = []
    for item in value:
        normalized = sanitize_translation_value(item)
        if normalized is None:
            return None
        sanitized.append(normalized)
    return sanitized


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "translation-service"}


@app.post("/translate")
def translate(request: TranslationRequest) -> dict[str, Any]:
    if request.text is not None:
        payload = generate_translation_payload(
            build_single_prompt(
                request.source_language,
                request.target_languages,
                request.text.strip(),
            )
        )

        translations = payload.get("translations") if isinstance(payload, dict) else None
        if not isinstance(translations, dict):
            raise HTTPException(status_code=502, detail="Gemini returned invalid translations")

        response_translations: dict[str, str] = {}
        for locale in request.target_languages:
            translated = sanitize_translation_value(translations.get(locale))
            if translated is None:
                raise HTTPException(
                    status_code=502,
                    detail=f"Gemini did not return a valid translation for {locale}",
                )
            response_translations[locale] = translated

        return {"translations": response_translations}

    payload = generate_translation_payload(
        build_batch_prompt(
            request.source_language,
            request.target_languages,
            [item.strip() for item in request.texts or []],
        )
    )

    translations = payload.get("translations") if isinstance(payload, dict) else None
    if not isinstance(translations, dict):
        raise HTTPException(status_code=502, detail="Gemini returned invalid translations")

    expected_count = len(request.texts or [])
    response_translations: dict[str, list[str]] = {}
    for locale in request.target_languages:
        translated = sanitize_translation_list(translations.get(locale), expected_count)
        if translated is None:
            raise HTTPException(
                status_code=502,
                detail=f"Gemini did not return a valid translation list for {locale}",
            )
        response_translations[locale] = translated

    return {"translations": response_translations}
