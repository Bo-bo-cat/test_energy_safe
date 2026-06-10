import logging
import os
import secrets
from urllib.parse import urlencode
from datetime import datetime, timezone, timedelta

import bcrypt
import httpx
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field

from app.database import get_database, col
from app.auth import create_access_token

logger = logging.getLogger(__name__)


async def _send_reset_email(to_email: str, code: str) -> None:
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("BREVO_SENDER_EMAIL", "ae3e45001@smtp-brevo.com")
    if not api_key:
        logger.warning("BREVO_API_KEY not set — email not sent")
        return

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 24px;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e0e0e0;">
        <h2 style="color: #FF6E00; margin-top: 0;">&#9889; Energy Safe — скидання паролю</h2>
        <p style="color: #444; font-size: 15px;">Ваш код підтвердження:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #FF6E00;">{code}</span>
        </div>
        <p style="color: #888; font-size: 13px;">Код дійсний протягом 1 години. Якщо ви не запитували скидання паролю — проігноруйте цей лист.</p>
      </div>
    </body>
    </html>
    """

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={"api-key": api_key, "Content-Type": "application/json"},
                json={
                    "sender": {"name": "Energy Safe", "email": sender_email},
                    "to": [{"email": to_email}],
                    "subject": "Energy Safe — код скидання паролю",
                    "htmlContent": html,
                },
                timeout=10,
            )
            resp.raise_for_status()
        logger.info("Reset email sent to %s via Brevo", to_email)
    except Exception as e:
        logger.error("Brevo error: %s", e, exc_info=True)


router = APIRouter(prefix="/auth", tags=["Auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_TOKEN_URL = "https://oauth2.googleapis.com/token"
_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@router.get("/google")
async def google_login():
    params = urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "prompt": "select_account",
    })
    return RedirectResponse(f"{_AUTH_URL}?{params}")


@router.get("/google/callback")
async def google_callback(code: str = None, error: str = None):
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/auth?error=google_denied")

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(_TOKEN_URL, data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })

    if token_resp.status_code != 200:
        return RedirectResponse(f"{FRONTEND_URL}/auth?error=google_token")

    access_token = token_resp.json().get("access_token")

    async with httpx.AsyncClient() as client:
        info_resp = await client.get(
            _USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if info_resp.status_code != 200:
        return RedirectResponse(f"{FRONTEND_URL}/auth?error=google_userinfo")

    info = info_resp.json()
    google_id = info.get("sub")
    email = info.get("email")
    name = info.get("name") or (email.split("@")[0] if email else "User")

    if not google_id or not email:
        return RedirectResponse(f"{FRONTEND_URL}/auth?error=google_data")

    db = get_database()

    doc = await db[col("users")].find_one({"google_id": google_id})
    if not doc:
        doc = await db[col("users")].find_one({"email": email})

    if doc:
        if not doc.get("google_id"):
            await db[col("users")].update_one(
                {"_id": doc["_id"]}, {"$set": {"google_id": google_id}}
            )
        user_id = str(doc["_id"])
        user_name = doc["name"]
    else:
        result = await db[col("users")].insert_one({
            "email": email,
            "name": name,
            "google_id": google_id,
            "password_hash": None,
            "has_inverter": False,
            "inverter_capacity_wh": None,
            "created_at": datetime.now(timezone.utc),
        })
        user_id = str(result.inserted_id)
        user_name = name

    jwt = create_access_token(user_id)
    qs = urlencode({"token": jwt, "user_id": user_id, "user_name": user_name})
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?{qs}")


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------

class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str
    new_password: str = Field(..., min_length=4)


@router.post("/password-reset/request")
async def request_password_reset(payload: PasswordResetRequest):
    db = get_database()
    doc = await db[col("users")].find_one({"email": payload.email})

    if not doc:
        raise HTTPException(status_code=404, detail="user_not_found")

    code = str(secrets.randbelow(1_000_000)).zfill(6)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    await db[col("password_resets")].replace_one(
        {"user_id": str(doc["_id"])},
        {
            "user_id": str(doc["_id"]),
            "email": payload.email,
            "code": code,
            "expires_at": expires_at,
        },
        upsert=True,
    )

    logger.info("[PASSWORD RESET] Code for %s: %s", payload.email, code)
    await _send_reset_email(payload.email, code)

    return {"message": "ok"}


@router.post("/password-reset/confirm")
async def confirm_password_reset(payload: PasswordResetConfirm):
    db = get_database()

    reset_doc = await db[col("password_resets")].find_one({"email": payload.email})
    if not reset_doc or reset_doc["code"] != payload.code:
        raise HTTPException(status_code=400, detail="Невірний код або email")

    if reset_doc["expires_at"].replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Код прострочено. Запросіть новий")

    new_hash = bcrypt.hashpw(payload.new_password.encode(), bcrypt.gensalt()).decode()
    await db[col("users")].update_one(
        {"_id": ObjectId(reset_doc["user_id"])},
        {"$set": {"password_hash": new_hash}},
    )
    await db[col("password_resets")].delete_one({"email": payload.email})

    return {"message": "ok"}
