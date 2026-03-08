"""
Shridhar Enterprise – Users Serializers
=========================================
All DRF serializers for user-related API endpoints.
Handles:
  - Signup: phone-primary, optional email, country code selection
  - Login: phone OR email + password
  - Profile: full read/update with verification status
  - Address: CRUD with lat/lng
"""

import re
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from phonenumber_field.serializerfields import PhoneNumberField
from .models import CustomUser, EmailVerificationToken, UserAddress


class SignupSerializer(serializers.Serializer):
    """
    User registration serializer.

    Validation rules (mirrors frontend behavior):
      - phone is always required
      - email is optional BUT if provided must be RFC 5322 valid
      - If email is blank/null → only phone required → valid
      - Password: min 8 chars
    """
    phone = PhoneNumberField(region='IN')
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    country_code = serializers.CharField(max_length=6, default='+91')
    is_india = serializers.BooleanField(default=True)

    def validate_email(self, value):
        """If email is provided, it must be valid format."""
        if not value:
            return None
        return value.lower()

    def validate_phone(self, value):
        """Phone must be unique across all users."""
        if CustomUser.objects.filter(phone=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value

    def create(self, validated_data):
        """Signup data validation only. User creation deferred until OTP verification."""
        return validated_data


class OTPSerializer(serializers.Serializer):
    """General OTP request/verify serializer."""
    phone = PhoneNumberField(region='IN')
    otp = serializers.CharField(max_length=6, required=False)
    purpose = serializers.ChoiceField(choices=['signup', 'login'], default='login')


class LoginSerializer(serializers.Serializer):
    """
    Email + Password login.
    Phone login is handled separately via OTP flow (login_otp_initiate/verify views).
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').lower()
        password = attrs.get('password')

        user = CustomUser.objects.filter(email=email).first()
        if not user:
            raise serializers.ValidationError("No account found with this email address.")
        if not user.check_password(password):
            raise serializers.ValidationError("Incorrect password. Please try again.")
        if not user.is_active:
            raise serializers.ValidationError("Your account is deactivated. Contact support.")

        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Full user profile with read-only computed fields."""

    phone = serializers.CharField(source='phone.__str__', read_only=True)
    email_status = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'full_name', 'phone', 'email', 'email_status',
            'email_verified', 'country_code', 'is_india',
            'profile_picture', 'receive_newsletters',
            'is_admin', 'date_joined',
        ]
        read_only_fields = ['id', 'phone', 'email_verified', 'is_admin', 'date_joined']

    def get_email_status(self, obj):
        """Returns display string for email verification status badge."""
        if not obj.email:
            return None
        return "verified" if obj.email_verified else "unverified"


class UserAddressSerializer(serializers.ModelSerializer):
    """CRUD serializer for user delivery addresses."""

    class Meta:
        model = UserAddress
        fields = [
            'id', 'label', 'recipient_name', 'phone',
            'line1', 'line2', 'landmark', 'city', 'state',
            'pincode', 'country', 'latitude', 'longitude', 'is_default',
        ]

    def validate_phone(self, value):
        return value

    def create(self, validated_data):
        """Associates the address with the requesting user from context."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
