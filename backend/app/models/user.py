from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    has_inverter: bool = False
    inverter_capacity_wh: Optional[float] = Field(default=None, ge=0)

    model_config = {"json_schema_extra": {
        "example": {
            "email": "user@example.com",
            "name": "Іван Іваненко",
            "has_inverter": True,
            "inverter_capacity_wh": 1200
        }
    }}


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    has_inverter: bool
    inverter_capacity_wh: Optional[float]
    created_at: datetime
