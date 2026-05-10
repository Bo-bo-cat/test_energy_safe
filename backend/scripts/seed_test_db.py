"""
Seed script for energy_safe_test database.
Usage:
    cd backend
    python -m scripts.seed_test_db
or with a custom .env file:
    ENV_FILE=../.env.test python -m scripts.seed_test_db
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import bcrypt
from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

env_file = os.getenv("ENV_FILE", str(Path(__file__).parent.parent.parent / ".env.test"))
load_dotenv(env_file)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "energy_safe_test")


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    await client.admin.command("ping")
    db = client[DATABASE_NAME]

    print(f"Connected to: {MONGODB_URL}")
    print(f"Database: {DATABASE_NAME}")

    # Drop existing test data
    for col in ["users", "devices", "systems", "scenarios", "device_catalog"]:
        await db[col].drop()
    print("Dropped existing collections.")

    # ── Users ──────────────────────────────────────────────────────────────────
    user1_id = ObjectId()
    user2_id = ObjectId()

    users = [
        {
            "_id": user1_id,
            "email": "test@example.com",
            "name": "Тест Юзер",
            "password_hash": _hash("test1234"),
            "has_inverter": True,
            "inverter_capacity_wh": 1200.0,
            "created_at": _now(),
        },
        {
            "_id": user2_id,
            "email": "demo@example.com",
            "name": "Демо Юзер",
            "password_hash": _hash("demo1234"),
            "has_inverter": False,
            "inverter_capacity_wh": None,
            "created_at": _now(),
        },
    ]
    await db.users.insert_many(users)
    print(f"Inserted {len(users)} users.")

    # ── Devices (user1) ────────────────────────────────────────────────────────
    dev1_id = ObjectId()
    dev2_id = ObjectId()
    dev3_id = ObjectId()
    dev4_id = ObjectId()

    devices_user1 = [
        {
            "_id": dev1_id,
            "user_id": str(user1_id),
            "model_name": "Samsung RB34",
            "category": "Холодильник",
            "power_watts": 150.0,
            "startup_current_watts": 300.0,
            "brand": "Samsung",
            "daily_usage_hours": 24.0,
            "is_critical": True,
            "tag": "Дім",
            "created_at": _now(),
        },
        {
            "_id": dev2_id,
            "user_id": str(user1_id),
            "model_name": "LG OLED55",
            "category": "Телевізор",
            "power_watts": 120.0,
            "startup_current_watts": None,
            "brand": "LG",
            "daily_usage_hours": 4.0,
            "is_critical": False,
            "tag": "Дім",
            "created_at": _now(),
        },
        {
            "_id": dev3_id,
            "user_id": str(user1_id),
            "model_name": "MacBook Pro 14",
            "category": "Ноутбук",
            "power_watts": 67.0,
            "startup_current_watts": None,
            "brand": "Apple",
            "daily_usage_hours": 8.0,
            "is_critical": True,
            "tag": "Офіс",
            "created_at": _now(),
        },
        {
            "_id": dev4_id,
            "user_id": str(user1_id),
            "model_name": "TP-Link Archer AX55",
            "category": "Роутер",
            "power_watts": 18.0,
            "startup_current_watts": None,
            "brand": "TP-Link",
            "daily_usage_hours": 24.0,
            "is_critical": True,
            "tag": "Офіс",
            "created_at": _now(),
        },
    ]

    # ── Devices (user2) ────────────────────────────────────────────────────────
    dev5_id = ObjectId()
    dev6_id = ObjectId()

    devices_user2 = [
        {
            "_id": dev5_id,
            "user_id": str(user2_id),
            "model_name": "Bosch WAJ28060UA",
            "category": "Пральна машина",
            "power_watts": 2000.0,
            "startup_current_watts": 4000.0,
            "brand": "Bosch",
            "daily_usage_hours": 1.0,
            "is_critical": False,
            "tag": "Дім",
            "created_at": _now(),
        },
        {
            "_id": dev6_id,
            "user_id": str(user2_id),
            "model_name": "Xiaomi Mi LED 9W",
            "category": "Освітлення",
            "power_watts": 9.0,
            "startup_current_watts": None,
            "brand": "Xiaomi",
            "daily_usage_hours": 6.0,
            "is_critical": False,
            "tag": "Дім",
            "created_at": _now(),
        },
    ]

    await db.devices.insert_many(devices_user1 + devices_user2)
    print(f"Inserted {len(devices_user1) + len(devices_user2)} devices.")

    # ── Energy systems ─────────────────────────────────────────────────────────
    sys1_id = ObjectId()
    sys2_id = ObjectId()
    sys3_id = ObjectId()

    systems = [
        {
            "_id": sys1_id,
            "user_id": str(user1_id),
            "model": "EcoFlow RIVER 2 Pro",
            "type": "Портативна електростанція",
            "power": 800.0,
            "battery": "768 Wh",
            "autonomy": "~2 год при 400 Вт",
            "selected_for_calculation": True,
            "created_at": _now(),
        },
        {
            "_id": sys2_id,
            "user_id": str(user1_id),
            "model": "Powerology 300W",
            "type": "ДБЖ",
            "power": 300.0,
            "battery": "280 Wh",
            "autonomy": "~1.5 год при 150 Вт",
            "selected_for_calculation": False,
            "created_at": _now(),
        },
        {
            "_id": sys3_id,
            "user_id": str(user2_id),
            "model": "Jackery Explorer 500",
            "type": "Портативна електростанція",
            "power": 500.0,
            "battery": "518 Wh",
            "autonomy": "~2 год при 250 Вт",
            "selected_for_calculation": True,
            "created_at": _now(),
        },
    ]
    await db.systems.insert_many(systems)
    print(f"Inserted {len(systems)} energy systems.")

    # ── Scenarios ──────────────────────────────────────────────────────────────
    scenarios = [
        {
            "_id": ObjectId(),
            "user_id": str(user1_id),
            "name": "Відключення 4 години (критичне)",
            "duration_hours": 4.0,
            "devices_included": [str(dev1_id), str(dev3_id), str(dev4_id)],
            "total_consumption_wh": (150.0 + 67.0 + 18.0) * 4,
            "battery_sufficient": True,
            "created_at": _now(),
        },
        {
            "_id": ObjectId(),
            "user_id": str(user1_id),
            "name": "Робочий день",
            "duration_hours": 8.0,
            "devices_included": [str(dev3_id), str(dev4_id)],
            "total_consumption_wh": (67.0 + 18.0) * 8,
            "battery_sufficient": True,
            "created_at": _now(),
        },
    ]
    await db.scenarios.insert_many(scenarios)
    print(f"Inserted {len(scenarios)} scenarios.")

    # ── Device catalog (AI cache) ──────────────────────────────────────────────
    catalog = [
        {
            "model_key": "samsung rb34",
            "model_name": "Samsung RB34",
            "category": "Холодильник",
            "power_watts": 150.0,
            "startup_current_watts": 300.0,
            "brand": "Samsung",
            "created_at": _now(),
        },
        {
            "model_key": "macbook pro 14",
            "model_name": "MacBook Pro 14",
            "category": "Ноутбук",
            "power_watts": 67.0,
            "startup_current_watts": None,
            "brand": "Apple",
            "created_at": _now(),
        },
        {
            "model_key": "tp-link archer ax55",
            "model_name": "TP-Link Archer AX55",
            "category": "Роутер",
            "power_watts": 18.0,
            "startup_current_watts": None,
            "brand": "TP-Link",
            "created_at": _now(),
        },
    ]
    await db.device_catalog.create_index("model_key", unique=True)
    await db.device_catalog.insert_many(catalog)
    print(f"Inserted {len(catalog)} device catalog entries.")

    client.close()

    print("\n✓ Seed completed successfully!")
    print(f"\n{'─'*50}")
    print("Test credentials:")
    print("  Email:    test@example.com")
    print("  Password: test1234")
    print()
    print("  Email:    demo@example.com")
    print("  Password: demo1234")
    print(f"{'─'*50}")


if __name__ == "__main__":
    asyncio.run(seed())
