from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=4)
    has_inverter: bool = False
    inverter_capacity_wh: Optional[float] = Field(default=None, ge=0)

    model_config = {"json_schema_extra": {
        "example": {
            "email": "user@example.com",
            "name": "Іван Іваненко",
            "password": "secret123",
            "has_inverter": True,
            "inverter_capacity_wh": 1200
        }
    }}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    has_inverter: bool
    inverter_capacity_wh: Optional[float]
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    user_name: str


class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    initials: str
    theme: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=4)
