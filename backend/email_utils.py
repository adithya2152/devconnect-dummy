import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
import random
from typing import Optional

load_dotenv()  # Load environment variables

def get_env_var(name: str, default: Optional[str] = None) -> str:
    """Get environment variable or raise error if missing."""
    value = os.getenv(name, default)
    if value is None:
        raise ValueError(f"Environment variable {name} is not set")
    return value

# Email configuration with type safety
SMTP_SERVER = get_env_var("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(get_env_var("SMTP_PORT", "587"))
EMAIL_ADDRESS = get_env_var("EMAIL_ADDRESS")
EMAIL_PASSWORD = get_env_var("EMAIL_PASSWORD")

def send_email(to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
    """Send an email using SMTP."""
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email
        msg["Subject"] = subject

        # Attach both plain text and HTML versions
        msg.attach(MIMEText(body, "plain", _charset="utf-8"))
        if html_body:
            msg.attach(MIMEText(html_body, "html", _charset="utf-8"))


        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)

        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def send_otp_email(to_email: str) -> Optional[str]:
    """Generate and send an OTP email."""
    otp = str(random.randint(100000, 999999))  # 6-digit OTP
    subject = "Your OTP Code"
    body = f"Your OTP code is: {otp}"
    html_body = f"""
    <html>
      <body>
        <h2>Your OTP Code</h2>
        <p>Use the following code to verify your email:</p>
        <h3>{otp}</h3>
        <p>This code expires in 10 minutes.</p>
      </body>
    </html>
    """

    if send_email(to_email, subject, body, html_body):
        return otp
    return None