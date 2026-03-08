"""
Shridhar Enterprise – Custom User Model
========================================
Enterprise-grade user model supporting:
  - Phone number as primary identifier (India: +91 auto-prefixed)
  - Optional email with verification workflow
  - Country code selection (India default, international dropdown)
  - JWT-based authentication (no session dependency)
  - Admin-ready: is_admin, is_staff flags for future admin panel
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from phonenumber_field.modelfields import PhoneNumberField


class CustomUserManager(BaseUserManager):
    """
    Custom manager for CustomUser.
    Primary identifier: phone number (unique).
    Email is optional but must be unique if provided.
    """

    def create_user(self, phone, password=None, **extra_fields):
        """Create and return a standard user with hashed password."""
        if not phone:
            raise ValueError('Phone number is required to create a user.')
        extra_fields.setdefault('is_active', True)
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        """Create a superuser with all admin permissions."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        return self.create_user(phone, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Primary user model for Shridhar Enterprise.

    Design decisions:
    - Phone is mandatory (used as USERNAME_FIELD for auth)
    - Email is optional; if provided, triggers verification workflow
    - country_code stores the dial code string (e.g. '+91', '+1')
    - is_india flag drives UI behavior (flag + auto +91 vs dropdown)
    - email_verified tracks link-click confirmation
    - is_admin, is_staff allow future admin panel integration
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ── Contact Fields ──────────────────────────────────────────────────────
    phone = PhoneNumberField(unique=True, region='IN', help_text="Primary identifier; India users get +91 auto-set.")
    email = models.EmailField(unique=False, null=True, blank=True, help_text="Optional; triggers email verification if provided.")
    country_code = models.CharField(max_length=6, default='+91', help_text="Dial code e.g. +91, +1, +44")
    is_india = models.BooleanField(default=True, help_text="True = India (+91 flag shown); False = international.")

    # ── Profile ─────────────────────────────────────────────────────────────
    full_name = models.CharField(max_length=150, blank=True)
    profile_picture = models.ImageField(upload_to='users/profiles/', null=True, blank=True)

    # ── Email Verification ──────────────────────────────────────────────────
    email_verified = models.BooleanField(default=False, help_text="True once user clicks verification link in email.")
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)

    # ── Permissions & Status ────────────────────────────────────────────────
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)     # Django admin access
    is_admin = models.BooleanField(default=False)     # Future Shridhar admin panel
    date_joined = models.DateTimeField(default=timezone.now)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    # ── Newsletter Preferences ──────────────────────────────────────────────
    receive_newsletters = models.BooleanField(default=True, help_text="If True, admin broadcasts go to this user.")

    objects = CustomUserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []          # phone is already USERNAME_FIELD

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
        ]

    def __str__(self):
        return f"{self.full_name or 'User'} | {self.phone}"

    @property
    def display_name(self):
        """Returns full name if set, otherwise cleaned phone number."""
        return self.full_name or str(self.phone)

    def get_email_for_notifications(self):
        """Returns email only if verified — used by notification service."""
        if self.email and self.email_verified:
            return self.email
        return None


class EmailVerificationToken(models.Model):
    """
    One-time token sent to user email for verification.
    Token expires after 24 hours. Used = True once consumed.

    Future: Can be repurposed for password-reset tokens with a 'token_type' field.
    """

    TOKEN_TYPE_EMAIL_VERIFY = 'email_verify'
    TOKEN_TYPE_PASSWORD_RESET = 'password_reset'
    TOKEN_TYPES = [
        (TOKEN_TYPE_EMAIL_VERIFY, 'Email Verification'),
        (TOKEN_TYPE_PASSWORD_RESET, 'Password Reset'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='email_tokens'
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    token_type = models.CharField(max_length=30, choices=TOKEN_TYPES, default=TOKEN_TYPE_EMAIL_VERIFY)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Email Verification Token'
        ordering = ['-created_at']

    def __str__(self):
        return f"Token({self.token_type}) for {self.user}"

    def is_valid(self):
        """Returns True if token is unused and not expired."""
        return not self.used and self.expires_at > timezone.now()


class UserAddress(models.Model):
    """
    Saved delivery addresses for a user.
    Stores lat/lng for accurate delivery distance calculation.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=50, default='Home', help_text="e.g. Home, Work, Other")
    recipient_name = models.CharField(max_length=150)
    phone = PhoneNumberField(region='IN')
    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, blank=True)
    landmark = models.CharField(max_length=150, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    country = models.CharField(max_length=100, default='India')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'User Address'
        verbose_name_plural = 'User Addresses'
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.label} – {self.recipient_name}, {self.city}"

    def save(self, *args, **kwargs):
        """Ensure only one default address per user."""
        if self.is_default:
            UserAddress.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class PhoneOTP(models.Model):
    """
    Stores OTPs for phone-based authentication (Login/Signup).
    OTPs expire after 60 seconds (1 minute).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = PhoneNumberField(region='IN', unique=True)
    otp = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=[('signup', 'Signup'), ('login', 'Login')], default='login')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Phone OTP'
        verbose_name_plural = 'Phone OTPs'

    def __str__(self):
        return f"OTP for {self.phone} ({self.purpose})"

    def is_valid(self):
        """Returns True if OTP is not yet expired."""
        return self.expires_at > timezone.now()
