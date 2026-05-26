import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, field_validator

router = APIRouter(prefix="/feedback", tags=["Feedback"])

SUPPORT_EMAIL = "energyappsf@gmail.com"


class FeedbackRequest(BaseModel):
    email: EmailStr
    message: str
    name: str | None = None

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()


@router.post("/")
async def send_feedback(data: FeedbackRequest):
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_email or not smtp_password:
        raise HTTPException(status_code=500, detail="Email service is not configured")

    sender_name = data.name.strip() if data.name and data.name.strip() else "Анонімний користувач"
    now = datetime.now().strftime("%d.%m.%Y %H:%M")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Energy Safe — нове звернення від {data.email}"
    msg["From"] = smtp_email
    msg["To"] = SUPPORT_EMAIL

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e0e0e0;">
        <h2 style="color: #FF6E00; margin-top: 0;">⚡ Нове звернення — Energy Safe</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 140px;">Ім'я:</td>
            <td style="padding: 8px 0; font-weight: bold;">{sender_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:{data.email}" style="color: #FF6E00;">{data.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Дата:</td>
            <td style="padding: 8px 0;">{now}</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <h3 style="color: #333; margin-top: 0;">Повідомлення:</h3>
        <p style="color: #444; line-height: 1.7; white-space: pre-wrap;">{data.message}</p>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, SUPPORT_EMAIL, msg.as_string())
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(status_code=500, detail="Email authentication failed")
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to send message")

    return {"status": "success"}
