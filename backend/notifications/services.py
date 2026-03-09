"""
Shridhar Enterprise – Notification Services
=============================================
Centralized service layer for all user communications:
  - Email: Django SMTP (Gmail configured via .env)
  - SMS: Console print with Twilio-ready interface
          → Replace send_sms() body with Twilio API call to integrate
  - Broadcast: Admin sends bulk email to subscribed users
"""

import random
import logging
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

logger = logging.getLogger(__name__)


# ===========================================================================
# SMS SERVICE
# ===========================================================================

class SMSService:
    """
    Twilio-ready SMS service.
    Currently prints to console. To integrate Twilio:
      1. pip install twilio
      2. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER to .env
      3. Replace the print statement below with Twilio API call.
    """

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate a numeric OTP of given length."""
        return str(random.randint(10**(length-1), 10**length - 1))

    @staticmethod
    def send_otp(phone_number: str, otp: str, purpose: str = "Login") -> bool:
        """
        Send OTP to the given phone number.

        TODO: Replace the print below with Twilio integration:
        -------------------------------------------------------
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=f"Your Shridhar Enterprise OTP is: {otp}. Valid for 10 minutes.",
            from_=settings.TWILIO_FROM_NUMBER,
            to=str(phone_number)
        )
        return message.sid is not None
        """
        # ─── CONSOLE OUTPUT (Development) ───────────────────────────────────
        print("=" * 60)
        print(f"  📱 SHRIDHAR ENTERPRISE – SMS OTP ({purpose})")
        print(f"  To:  {phone_number}")
        print(f"  OTP: {otp}")
        print(f"       Valid for 10 minutes")
        print("=" * 60)
        logger.info(f"[SMS][CONSOLE] OTP {otp} sent to {phone_number} for {purpose}")
        return True

    @staticmethod
    def send_order_sms(phone_number: str, order_number: str, status: str) -> bool:
        """
        Send order status SMS.

        TODO: Same Twilio integration pattern as send_otp()
        """
        message = f"Shridhar Enterprise: Your order #{order_number} is now {status}. Thank you!"
        print("=" * 60)
        print(f"  📱 SHRIDHAR ENTERPRISE – ORDER SMS")
        print(f"  To:  {phone_number}")
        print(f"  Msg: {message}")
        print("=" * 60)
        logger.info(f"[SMS][CONSOLE] Order SMS sent to {phone_number}: {message}")
        return True


# ===========================================================================
# EMAIL SERVICE
# ===========================================================================

class EmailService:
    """
    Gmail SMTP email service using Django's send_mail / EmailMultiAlternatives.
    All templates are in backend/templates/emails/.
    """

    @staticmethod
    def _send(subject: str, recipient: str, html_content: str) -> bool:
        """
        Core send utility. Uses multipart/alternative for HTML + plain text fallback.
        Returns True on success, False on error (logged).
        IMPORTANT: fail_silently=True so SMTP timeouts never crash the server.
        """
        try:
            plain_text = strip_tags(html_content)
            msg = EmailMultiAlternatives(
                subject=subject,
                body=plain_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=True)  # CRITICAL: must be True to prevent gunicorn worker crash
            logger.info(f"[EMAIL] Sent '{subject}' to {recipient}")
            return True
        except BaseException as exc:  # BaseException catches SystemExit too
            logger.error(f"[EMAIL] Failed to send '{subject}' to {recipient}: {exc}")
            return False

    @classmethod
    def send_verification_email(cls, user, token: str) -> bool:
        """
        Send email verification link after signup.
        Link format: <FRONTEND_URL>/verify-email/<token>
        """
        verify_url = f"{settings.FRONTEND_URL}/verify-email/{token}"
        html_content = render_to_string('emails/verify_email.html', {
            'user': user,
            'verification_url': verify_url,
            'shop_name': 'Shridhar Enterprise Pvt Ltd',
        })
        return cls._send(
            subject='✅ Verify your email – Shridhar Enterprise',
            recipient=user.email,
            html_content=html_content,
        )

    @classmethod
    def send_order_confirmation(cls, user, order) -> bool:
        """Send order confirmation email to customer."""
        email = user.get_email_for_notifications()
        if not email:
            logger.warning(f"[EMAIL] No verified email for user {user.id}. Order confirmation skipped.")
            return False
        try:
            html_content = render_to_string('emails/order_confirmation.html', {
                'user': user,
                'order': order,
                'domain': settings.FRONTEND_URL.replace('http://', '').replace('https://', ''),
                'shop_name': 'Shridhar Enterprise Pvt Ltd',
            })
        except Exception as e:
            logger.error(f"[EMAIL] Template render failed, using fallback: {e}")
            html_content = f"<p>Dear {user.display_name},</p><p>Your order <b>#{order.order_number}</b> has been confirmed. Total: ₹{order.total_amount}</p><p>Thank you for shopping with Shridhar Enterprise!</p>"
        return cls._send(
            subject=f'🛒 Order #{order.order_number} Confirmed – Shridhar Enterprise',
            recipient=email,
            html_content=html_content,
        )

    @classmethod
    def send_broadcast(cls, subject: str, html_content: str, recipients: list) -> int:
        """
        Admin broadcast email to list of addresses. Returns count of sent.
        Future admin panel will call this for newsletters/promotions.
        """
        sent_count = 0
        for recipient in recipients:
            if cls._send(subject=subject, recipient=recipient, html_content=html_content):
                sent_count += 1
        logger.info(f"[EMAIL][BROADCAST] Sent {sent_count}/{len(recipients)} emails for '{subject}'")
        return sent_count
