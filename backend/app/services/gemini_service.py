import os
import json
from google import genai
from fastapi import HTTPException
from app.models.device import VALID_CATEGORIES

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

_client = None


def _get_client():
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="Gemini API key not configured")
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


async def lookup_device_specs(model_name: str) -> dict:
    """
    Queries Gemini for device specs by model name.
    Returns {"is_valid": bool, "category": str, "power_watts": float, "brand": str}
    Raises HTTPException 422 if not a real wall-plug electrical appliance.
    """
    if not model_name or len(model_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Введіть коректну назву моделі пристрою")

    categories_str = ", ".join(f'"{c}"' for c in VALID_CATEGORIES)
    prompt = (
        "You are a home appliance database. Given a device model name, determine:\n"
        "1. is_valid: Is this a real electrical home appliance that plugs into a wall outlet? (true/false)\n"
        f"2. category: Pick ONE category from this exact list: [{categories_str}]\n"
        "3. power_watts: Typical power consumption in watts (positive number, e.g. 150)\n"
        "4. brand: Manufacturer brand name (e.g. \"Samsung\")\n"
        "Rules:\n"
        "- is_valid must be false for: random words, food, animals, people names, non-electrical items\n"
        "- is_valid must be true only for real consumer electronics/appliances\n"
        "Respond ONLY with valid JSON, no markdown, no extra text:\n"
        "{\"is_valid\": bool, \"category\": \"string\", \"power_watts\": number, \"brand\": \"string\"}\n\n"
        f"Device model name: \"{model_name}\""
    )

    try:
        client = _get_client()
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
        )
        text = response.text.strip()

        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(
                line for line in lines
                if not line.startswith("```")
            ).strip()

        result = json.loads(text)
        is_valid = bool(result.get("is_valid", False))
        category = result.get("category", "Інше")
        power_watts = float(result.get("power_watts", 0))
        brand = str(result.get("brand", "Невідомо")).strip() or "Невідомо"

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Не вдалося обробити відповідь від Gemini API")
    except Exception as e:
        error_msg = str(e)
        if "API_KEY" in error_msg or "api key" in error_msg.lower():
            raise HTTPException(status_code=503, detail="Gemini API key недійсний або відсутній")
        raise HTTPException(status_code=502, detail=f"Помилка Gemini API: {error_msg}")

    if not is_valid:
        raise HTTPException(
            status_code=422,
            detail="Це не схоже на побутовий електроприлад. Введіть правильну назву моделі (наприклад: Samsung RB34, LG WM3400)"
        )

    if category not in VALID_CATEGORIES:
        category = "Інше"

    if power_watts <= 0:
        raise HTTPException(status_code=422, detail="Не вдалося визначити споживання пристрою")

    return {
        "is_valid": True,
        "category": category,
        "power_watts": power_watts,
        "brand": brand,
    }


async def classify_device(model_name: str) -> dict:
    """Kept for update_device backward compat — returns category only."""
    specs = await lookup_device_specs(model_name)
    return {"is_valid": specs["is_valid"], "category": specs["category"]}
