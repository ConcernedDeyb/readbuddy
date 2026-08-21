import smtplib
from email.mime.text import MIMEText

from app.config import settings


def send_verification_email(to_email: str, token: str) -> None:
    verify_link = f"{settings.frontend_base_url}/verify-teacher?token={token}"
    body = (
        f"Welcome to ReadBuddy!\n\n"
        f"Please verify your email by clicking the link below:\n{verify_link}\n\n"
        f"If you didn't create this account, you can ignore this email."
    )
    msg = MIMEText(body)
    msg["Subject"] = "Verify your ReadBuddy teacher account"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, [to_email], msg.as_string())
    except Exception as e:
        print(f"[SMTP Warning] Could not send verification email to {to_email}: {e}")


def send_password_reset_email(to_email: str, token: str) -> None:
    reset_link = f"{settings.frontend_base_url}/reset-password?token={token}"
    body = (
        f"ReadBuddy Password Reset Request\n\n"
        f"Your reset code is: {token}\n\n"
        f"Or click the link below to reset your password:\n{reset_link}\n\n"
        f"If you did not request a password reset, please ignore this email."
    )
    msg = MIMEText(body)
    msg["Subject"] = "Reset your ReadBuddy password"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, [to_email], msg.as_string())
    except Exception as e:
        print(f"[SMTP Warning] Could not send password reset email to {to_email}: {e}")