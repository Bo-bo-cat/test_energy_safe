import os
import json
import httpx
import xml.etree.ElementTree as ET
from fastapi import HTTPException
from app.models.device import VALID_CATEGORIES

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

# Per-category validated ranges: (min_watts, max_watts, (startup_min_mult, startup_max_mult) or None)
# Startup power is real physics: inrush current for induction motors, null for resistive/electronic loads.
_CATEGORY_SPECS: dict[str, tuple] = {
    "Холодильник":        (80,   400,  (3.5, 5.0)),
    "Кондиціонер":        (700,  5000, (5.0, 7.0)),
    "Пральна машина":     (500,  2500, (3.0, 5.0)),
    "Посудомийна машина": (1200, 2500, (2.0, 3.0)),
    "Мікрохвильовка":     (600,  2000, None),
    "Електрочайник":      (1500, 3000, None),
    "Кавоварка":          (700,  2000, None),
    "Телевізор":          (20,   500,  None),
    "Ноутбук":            (30,   200,  None),
    "Роутер":             (5,    30,   None),
    "Освітлення":         (3,    300,  None),
    "Зарядний пристрій":  (5,    150,  None),
    "Інше":               (10,   6000, None),
}


def _validate_specs(
    category: str, power_watts: float, startup_current_watts: float | None
) -> tuple[float, float | None]:
    """Clamp power to realistic range; compute startup power from physics-based multipliers."""
    spec = _CATEGORY_SPECS.get(category, _CATEGORY_SPECS["Інше"])
    min_w, max_w, startup_range = spec

    power_watts = max(min_w, min(power_watts, max_w))

    if startup_range is None:
        return power_watts, None

    min_mult, max_mult = startup_range
    if startup_current_watts is None:
        # Use midpoint of physical range when AI/Icecat doesn't provide it
        startup_current_watts = power_watts * ((min_mult + max_mult) / 2)
    else:
        startup_current_watts = max(
            power_watts * min_mult, min(startup_current_watts, power_watts * max_mult)
        )

    return power_watts, round(startup_current_watts)


def _extract_prod_id(model_name: str, brand: str) -> str:
    """Strip brand prefix so 'Samsung RB34T632ESA' → 'RB34T632ESA'."""
    name = model_name.strip()
    if brand and name.lower().startswith(brand.lower()):
        return name[len(brand):].strip()
    return name


async def _fetch_icecat_power(brand: str, prod_id: str) -> float | None:
    """
    Fetch exact rated power (W) from Open Icecat — official manufacturer datasheet database.
    Not a sales site; data is submitted directly by manufacturers (Samsung, LG, Bosch, etc.).

    Setup: register free at https://icecat.biz and set ICECAT_USERNAME=your@email in .env
    """
    username = os.getenv("ICECAT_USERNAME", "")
    if not username or not brand or not prod_id:
        return None

    params = {
        "usermail": username,
        "lang": "EN",
        "brand": brand,
        "prod_id": prod_id,
        "output": "productxml",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get("https://data.icecat.biz/search.php", params=params)
        if resp.status_code != 200:
            return None

        root = ET.fromstring(resp.text)

        product = root.find(".//Product")
        if product is None or product.get("ErrorMessage"):
            return None

        # Icecat XML: <ProductFeature><Feature><Name Value="Power consumption"/></Feature>
        #             <LocalValue Value="140"/></ProductFeature>
        for pf in root.findall(".//ProductFeature"):
            name_el = pf.find(".//Name")
            if name_el is None:
                continue
            feature_name = name_el.get("Value", "").lower()
            if "power consumption" in feature_name or "rated power" in feature_name:
                for tag in ("LocalValue", "Value"):
                    val_el = pf.find(tag)
                    if val_el is not None:
                        try:
                            watts = float(val_el.get("Value", "0"))
                            if watts > 0:
                                return watts
                        except (ValueError, TypeError):
                            pass
    except Exception:
        pass

    return None


async def _groq_classify(model_name: str) -> dict:
    """Ask Groq for category, brand, estimated power, and validity."""
    categories_str = ", ".join(f'"{c}"' for c in VALID_CATEGORIES)
    prompt = (
        "You are a home appliance power consumption expert.\n"
        "Given a device model name, return JSON with these fields:\n\n"
        "1. is_valid (bool): true only if this is a real electrical home appliance or consumer electronics.\n"
        f"2. category (string): exactly one of [{categories_str}].\n"
        "3. power_watts (number): the RATED RUNNING power in watts from the device nameplate or official specs.\n"
        "   - This is the MAXIMUM continuous draw, NOT average or standby consumption.\n"
        "   - If you know the exact model: use its official rated wattage.\n"
        "   - If you only know the brand/series: use the typical rated wattage for that product line.\n"
        "   - If you only know the category: use the TYPICAL rated wattage for that appliance type.\n"
        "   Reference values (nameplate rated power):\n"
        "     Fridge Samsung RB34=140W, Fridge Bosch KGN=150W\n"
        "     Washing machine LG F4=2000W, Washing machine Bosch WAJ=2000W\n"
        "     Dishwasher Bosch SMS=2400W\n"
        "     Microwave Samsung MG23=800W, Microwave LG MH=1000W\n"
        "     Coffee machine DeLonghi Magnifica=1450W, Coffee machine Philips EP=1500W, Nespresso Vertuo=1500W\n"
        "     Kettle Bosch TWK=2400W, Kettle Philips HD=2400W\n"
        "     Air conditioner Daikin FTXB35=1100W, AC LG S09=900W\n"
        "     TV LG 32LM=55W, TV Samsung UE43=100W\n"
        "     Laptop Dell XPS=65W, Laptop MacBook Pro=96W\n"
        "     Router TP-Link Archer=18W\n"
        "     LED bulb=10W, LED strip 5m=25W\n"
        "     Phone charger=20W, Laptop charger=65W\n"
        "4. brand (string): manufacturer name only (e.g. 'Samsung', 'LG', 'Bosch', 'DeLonghi').\n\n"
        "Respond ONLY with valid JSON, no markdown, no explanation:\n"
        "{\"is_valid\": bool, \"category\": \"string\", \"power_watts\": number, \"brand\": \"string\"}\n\n"
        f"Device: \"{model_name}\""
    )

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
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
        text = "\n".join(l for l in text.splitlines() if not l.startswith("```")).strip()

    return json.loads(text)


async def lookup_device_specs(model_name: str) -> dict:
    if not model_name or len(model_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Введіть коректну назву моделі пристрою")
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Groq API key не налаштовано")

    # Step 1: Groq identifies category, brand, validity, and gives an AI power estimate
    try:
        result = await _groq_classify(model_name)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Не вдалося обробити відповідь від Groq API")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(status_code=503, detail="Groq API key недійсний")
        raise HTTPException(status_code=502, detail=f"Помилка Groq API: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Помилка Groq API: {str(e)}")

    is_valid = bool(result.get("is_valid", False))
    if not is_valid:
        raise HTTPException(
            status_code=422,
            detail="Це не схоже на побутовий електроприлад. Введіть правильну назву моделі (наприклад: Samsung RB34, LG WM3400)",
        )

    category = result.get("category", "Інше")
    if category not in VALID_CATEGORIES:
        category = "Інше"

    brand = str(result.get("brand", "Невідомо")).strip() or "Невідомо"
    power_watts = float(result.get("power_watts", 0))

    # Step 2: Override AI power estimate with real manufacturer data from Open Icecat
    # Icecat data is sourced directly from manufacturers — not AI-generated
    prod_id = _extract_prod_id(model_name, brand)
    icecat_power = await _fetch_icecat_power(brand, prod_id)
    if icecat_power and icecat_power > 0:
        power_watts = icecat_power

    if power_watts <= 0:
        raise HTTPException(status_code=422, detail="Не вдалося визначити споживання пристрою")

    # Step 3: Compute startup/inrush power from physics-based multipliers per category
    # and clamp all values to realistic ranges
    power_watts, startup_current_watts = _validate_specs(category, power_watts, None)

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
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
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
            text = "\n".join(l for l in text.splitlines() if not l.startswith("```")).strip()

        result = json.loads(text)

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
