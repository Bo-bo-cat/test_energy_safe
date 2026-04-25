from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

VALID_CATEGORIES = [
    "Холодильник", "Телевізор", "Пральна машина", "Мікрохвильовка",
    "Кондиціонер", "Ноутбук", "Роутер", "Освітлення", "Зарядний пристрій",
    "Посудомийна машина", "Електрочайник", "Кавоварка", "Інше"
]


class DeviceCreate(BaseModel):
    model_name: str = Field(..., min_length=1, max_length=200)
    daily_usage_hours: float = Field(default=1.0, ge=0, le=24)
    is_critical: bool = False
    category: Optional[str] = None
    power_watts: Optional[float] = Field(default=None, ge=0)
    startup_current_watts: Optional[float] = Field(default=None, ge=0)

    model_config = {"json_schema_extra": {
        "example": {
            "model_name": "Samsung RB34",
            "daily_usage_hours": 24,
            "is_critical": True
        }
    }}


class DeviceUpdate(BaseModel):
    model_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    daily_usage_hours: Optional[float] = Field(default=None, ge=0, le=24)
    is_critical: Optional[bool] = None


class DeviceResponse(BaseModel):
    id: str
    user_id: str
    model_name: str
    category: str
    power_watts: float
    startup_current_watts: Optional[float] = None
    brand: str
    daily_usage_hours: float
    is_critical: bool
    created_at: datetime


class DeviceCatalogEntry(BaseModel):
    model_name: str
    category: str
    power_watts: float
    brand: str


class ClassifyRequest(BaseModel):
    model_name: str = Field(..., min_length=1, max_length=200)

    model_config = {"json_schema_extra": {
        "example": {"model_name": "Samsung RB34"}
    }}


class ClassifyResponse(BaseModel):
    category: str
    power_watts: float
    startup_current_watts: Optional[float] = None
    brand: str
    is_valid: bool
