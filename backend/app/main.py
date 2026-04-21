import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.routes import users, devices, scenarios

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    db = get_database()
    await db.device_catalog.create_index("model_key", unique=True)
    yield
    await close_mongo_connection()


app = FastAPI(
    title="Energy Safe API",
    description="Backend для підрахунку споживання електроенергії через інвертор/зарядну станцію",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router)
app.include_router(devices.router)
app.include_router(scenarios.router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Ласкаво просимо до Energy Safe API",
        "description": "Backend для підрахунку споживання електроенергії через інвертор/зарядну станцію",
        "status": "ok",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "users": "/users",
            "devices": "/devices",
            "scenarios": "/scenarios",
        },
    }


@app.get("/health", tags=["Health"])
async def health_check():
    db_status = "disconnected"
    try:
        db = get_database()
        if db is not None:
            await db.command("ping")
            db_status = "connected"
    except Exception:
        db_status = "error"

    return {"status": "ok", "db": db_status}
