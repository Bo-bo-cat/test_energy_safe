import os
import json
import httpx
from fastapi import HTTPException
from app.models.device import VALID_CATEGORIES

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


async def lookup_device_specs(model_name: str) -> dict:
    if not model_name or len(model_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Введіть коректну назву моделі пристрою")

    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Groq API key не налаштовано")

    categories_str = ", ".join(f'"{c}"' for c in VALID_CATEGORIES)
    prompt = (
        "You are a home appliance database. Given a device model name, determine:\n"
        "1. is_valid: Is this a real electrical home appliance that plugs into a wall outlet? (true/false)\n"
        f"2. category: Pick ONE category from this exact list: [{categories_str}]\n"
        "3. power_watts: Typical rated power consumption in watts (positive number, e.g. 150)\n"
        "4. startup_current_watts: Peak startup power in watts for appliances with motors/compressors "
        "(fridges, washing machines, AC, dishwashers — typically 3-7x power_watts). "
        "Use null for devices without motors (TVs, routers, laptops, lights, chargers, microwaves, kettles).\n"
        "5. brand: Manufacturer brand name (e.g. \"Samsung\")\n"
        "Rules:\n"
        "- is_valid must be false for: random words, food, animals, people names, furniture, non-electrical items\n"
        "- is_valid must be true only for real consumer electronics/appliances that consume electricity\n"
        "Respond ONLY with valid JSON, no markdown, no extra text:\n"
        "{\"is_valid\": bool, \"category\": \"string\", \"power_watts\": number, \"startup_current_watts\": number|null, \"brand\": \"string\"}\n\n"
        f"Device model name: \"{model_name}\""
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 150,
                },
            )
            response.raise_for_status()
            text = response.json()["choices"][0]["message"]["content"].strip()

        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(line for line in lines if not line.startswith("```")).strip()

        result = json.loads(text)
        is_valid = bool(result.get("is_valid", False))
        category = result.get("category", "Інше")
        power_watts = float(result.get("power_watts", 0))
        raw_startup = result.get("startup_current_watts")
        startup_current_watts = float(raw_startup) if raw_startup is not None else None
        brand = str(result.get("brand", "Невідомо")).strip() or "Невідомо"

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Не вдалося обробити відповідь від Groq API")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(status_code=503, detail="Groq API key недійсний")
        raise HTTPException(status_code=502, detail=f"Помилка Groq API: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Помилка Groq API: {str(e)}")

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
        "startup_current_watts": startup_current_watts,
        "brand": brand,
    }


async def classify_device(model_name: str) -> dict:
    specs = await lookup_device_specs(model_name)
    return {"is_valid": specs["is_valid"], "category": specs["category"]}


async def lookup_ups_specs(model_name: str) -> dict:
    if not model_name or len(model_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Введіть коректну назву системи")

    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Groq API key не налаштовано")

    prompt = (
        "You are a power backup systems database. Given a UPS, generator, power station, or inverter model name:\n"
        "1. is_valid: Is this a real power backup / energy storage device? (true/false)\n"
        "2. type: Device type in Ukrainian. Choose one: 'ДБЖ', 'Портативна електростанція', 'Генератор', 'Інвертор', 'Акумуляторна станція'\n"
        "3. power_watts: Rated output power in watts (positive number, e.g. 300)\n"
        "4. battery_wh: Battery capacity in Wh (number). Use null for generators without battery.\n"
        "5. autonomy: Estimated autonomy at 50% load in Ukrainian (e.g. '~2 год', '~5 год'). "
        "For generators write 'залежить від навантаження'.\n"
        "Respond ONLY with valid JSON, no markdown, no extra text:\n"
        "{\"is_valid\": bool, \"type\": \"string\", \"power_watts\": number, \"battery_wh\": number|null, \"autonomy\": \"string\"}\n\n"
        f"Device model name: \"{model_name}\""
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 150,
                },
            )
            response.raise_for_status()
            text = response.json()["choices"][0]["message"]["content"].strip()

        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(line for line in lines if not line.startswith("```")).strip()

        result = json.loads(text)

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Не вдалося обробити відповідь від Groq API")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(status_code=503, detail="Groq API key недійсний")
        raise HTTPException(status_code=502, detail=f"Помилка Groq API: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Помилка Groq API: {str(e)}")

    if not bool(result.get("is_valid", False)):
        raise HTTPException(
            status_code=422,
            detail="Це не схоже на систему резервного живлення. Введіть назву ДБЖ, генератора або електростанції.",
        )

    power_watts = float(result.get("power_watts", 0))
    if power_watts <= 0:
        raise HTTPException(status_code=422, detail="Не вдалося визначити потужність системи")

    battery_wh = result.get("battery_wh")
    battery_str = f"{int(battery_wh)} Wh" if battery_wh else "–"

    return {
        "type": str(result.get("type", "ДБЖ")).strip(),
        "power": power_watts,
        "battery": battery_str,
        "autonomy": str(result.get("autonomy", "–")).strip(),
    }
