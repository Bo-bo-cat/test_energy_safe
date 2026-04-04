import os
import json
import google.generativeai as genai
from fastapi import HTTPException
from app.models.device import VALID_CATEGORIES

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

_model = None


def _get_model():
    global _model
    if _model is None:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="Gemini API key not configured")
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-2.0-flash")
    return _model


async def classify_device(model_name: str) -> dict:
    """
    Calls Gemini API to classify a device model name.
    Returns {"is_valid": bool, "category": str}
    Raises HTTPException 400 if model_name looks like garbage input.
    Raises HTTPException 422 if Gemini says it's not a real device.
    """
    if not model_name or len(model_name.strip()) < 2:
        raise HTTPException(
            status_code=400,
            detail="Введіть коректну назву моделі пристрою"
        )

    categories_str = ", ".join(f'"{c}"' for c in VALID_CATEGORIES)
    prompt = (
        f'You are a home appliance classifier. Given a device model name, determine:\n'
        f'1. Is this a real home appliance? (yes/no)\n'
        f'2. What category does it belong to from this list: [{categories_str}]\n'
        f'Respond ONLY in JSON: {{"is_valid": bool, "category": "string"}}\n\n'
        f'Device model name: "{model_name}"'
    )

    try:
        model = _get_model()
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Strip markdown code fences if present
        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(
                line for line in lines
                if not line.startswith("```")
            ).strip()

        result = json.loads(text)
        is_valid = bool(result.get("is_valid", False))
        category = result.get("category", "Інше")

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="Не вдалося обробити відповідь від Gemini API"
        )
    except Exception as e:
        error_msg = str(e)
        if "API_KEY" in error_msg or "api key" in error_msg.lower():
            raise HTTPException(status_code=503, detail="Gemini API key недійсний або відсутній")
        raise HTTPException(
            status_code=502,
            detail=f"Помилка Gemini API: {error_msg}"
        )

    if not is_valid:
        raise HTTPException(
            status_code=422,
            detail="Введіть коректну назву моделі пристрою"
        )

    # Map unknown category to "Інше"
    if category not in VALID_CATEGORIES:
        category = "Інше"

    return {"is_valid": is_valid, "category": category}
