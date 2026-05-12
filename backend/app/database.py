import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "energy_safe")
TEST_MODE = os.getenv("TEST_MODE", "false").lower() == "true"

client: AsyncIOMotorClient = None
db = None


def col(name: str) -> str:
    """Return collection name with _test suffix when TEST_MODE is enabled."""
    return f"{name}_test" if TEST_MODE else name


async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    # Ping to verify connection
    await client.admin.command("ping")
    print(f"Connected to MongoDB: {DATABASE_NAME}")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_database():
    return db
