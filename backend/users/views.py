"""
Shridhar Enterprise – Users Views (API Endpoints)
====================================================
REST endpoints for authentication and user management.
Refactored for:
  1. Strict OTP-first signup (User created only after verification)
  2. Dual-mode login (OTP for phone / Password for email)
  3. 60-second OTP expiry
  4. Dev mode: OTP returned in response for frontend display
"""

import requests
import uuid
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, EmailVerificationToken, UserAddress, PhoneOTP
from .serializers import SignupSerializer, LoginSerializer, UserProfileSerializer, UserAddressSerializer
from notifications.services import EmailService, SMSService


def get_tokens_for_user(user):
    """Generate JWT access + refresh token pair for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# ─────────────────────────────────────────────────────────────────────────────
# LOCATION – Reverse Geocode via Google Maps (Backend Proxy)
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def reverse_geocode_view(request):
    """
    GET /api/auth/reverse-geocode/?lat=<lat>&lon=<lon>
    Backend proxy to Google Maps Geocoding API.
    Keeps API key server-side and returns structured address components.
    """
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')

    if not lat or not lon:
        return Response({'success': False, 'message': 'lat and lon required.'}, status=400)

    api_key = settings.GOOGLE_MAPS_API_KEY
    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lon}&key={api_key}"

    try:
        resp = requests.get(url, timeout=8)
        data = resp.json()

        if data.get('status') != 'OK' or not data.get('results'):
            return Response({'success': False, 'message': 'No address found for coordinates.'}, status=200)

        # Parse address components from the first result
        components = data['results'][0].get('address_components', [])
        addr = {}
        for c in components:
            types = c.get('types', [])
            if 'route' in types:
                addr['road'] = c['long_name']
            elif 'sublocality_level_1' in types or 'sublocality' in types:
                addr['neighbourhood'] = c['long_name']
            elif 'locality' in types:
                addr['city'] = c['long_name']
            elif 'administrative_area_level_1' in types:
                addr['state'] = c['long_name']
            elif 'postal_code' in types:
                addr['pincode'] = c['long_name']
            elif 'neighborhood' in types:
                addr['suburb'] = c['long_name']

        return Response({'success': True, 'address': addr, 'formatted': data['results'][0].get('formatted_address', '')})

    except Exception as e:
        return Response({'success': False, 'message': f'Geocoding service error: {str(e)}'}, status=200)



# ─────────────────────────────────────────────────────────────────────────────
# SIGNUP – Step 1: Initiate (validate form data, generate OTP)
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def signup_initiate_view(request):
    """
    POST /api/auth/signup/initiate/
    Validates form data and generates/stores an OTP.
    Returns the OTP in the response (dev mode — no SMS gateway).
    """
    serializer = SignupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    phone = serializer.validated_data['phone']

    # Generate OTP and store in DB
    otp_code = SMSService.generate_otp()
    expires_at = timezone.now() + timedelta(seconds=60)

    PhoneOTP.objects.update_or_create(
        phone=phone,
        defaults={
            'otp': otp_code,
            'purpose': 'signup',
            'expires_at': expires_at,
            'is_verified': False
        }
    )

    SMSService.send_otp(str(phone), otp_code, purpose="Signup Verification")

    return Response({
        'success': True,
        'message': 'OTP generated. Valid for 60 seconds.',
        # ── DEV MODE: return OTP so frontend can display it ──────────────────
        'dev_otp': otp_code,
    })


# ─────────────────────────────────────────────────────────────────────────────
# SIGNUP – Step 2: Verify OTP and create user
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def signup_verify_view(request):
    """
    POST /api/auth/signup/verify/
    Verifies OTP and creates the user account.
    """
    serializer = SignupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    phone = serializer.validated_data['phone']
    otp_code = request.data.get('otp', '').strip()

    try:
        otp_record = PhoneOTP.objects.get(phone=phone, purpose='signup')
    except PhoneOTP.DoesNotExist:
        return Response({'success': False, 'message': 'OTP not found. Please request again.'}, status=status.HTTP_400_BAD_REQUEST)

    if not otp_record.is_valid():
        return Response({'success': False, 'message': 'OTP has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    if otp_record.otp != otp_code:
        return Response({'success': False, 'message': 'Invalid OTP. Please check and try again.'}, status=status.HTTP_400_BAD_REQUEST)

    # ── OTP Valid → Create User ───────────────────────────────────────────────
    validated_data = serializer.validated_data
    user = CustomUser.objects.create_user(
        phone=validated_data['phone'],
        password=validated_data['password'],
        email=validated_data.get('email') or None,
        full_name=validated_data.get('full_name', ''),
        country_code=validated_data.get('country_code', '+91'),
        is_india=validated_data.get('is_india', True),
    )

    # Cleanup OTP
    otp_record.delete()

    # Send email verification if email provided
    if user.email:
        try:
            token = EmailVerificationToken.objects.create(
                user=user,
                token=uuid.uuid4(),
                token_type=EmailVerificationToken.TOKEN_TYPE_EMAIL_VERIFY,
                expires_at=timezone.now() + timedelta(hours=24),
            )
            EmailService.send_verification_email(user, str(token.token))
        except Exception:
            pass  # Non-blocking

    tokens = get_tokens_for_user(user)
    profile = UserProfileSerializer(user).data

    return Response({
        'success': True,
        'message': f'Welcome to Shridhar Enterprise, {user.full_name or "friend"}! Your account has been created.',
        'tokens': tokens,
        'user': profile
    })


# ─────────────────────────────────────────────────────────────────────────────
# LOGIN – OTP mode (phone number only)
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_otp_initiate_view(request):
    """
    POST /api/auth/login/otp/initiate/
    Send OTP to phone number for login.
    """
    phone = request.data.get('phone', '').strip()
    if not phone:
        return Response({'success': False, 'message': 'Phone number is required.'}, status=400)

    user = CustomUser.objects.filter(phone=phone).first()
    if not user:
        return Response({'success': False, 'message': 'No account found with this phone number.'}, status=404)

    if not user.is_active:
        return Response({'success': False, 'message': 'Your account has been deactivated. Contact support.'}, status=403)

    # Generate OTP
    otp_code = SMSService.generate_otp()
    expires_at = timezone.now() + timedelta(seconds=60)

    PhoneOTP.objects.update_or_create(
        phone=phone,
        defaults={
            'otp': otp_code,
            'purpose': 'login',
            'expires_at': expires_at,
            'is_verified': False
        }
    )

    SMSService.send_otp(str(phone), otp_code, purpose="Login Verification")

    return Response({
        'success': True,
        'message': 'OTP sent for login. Valid for 60 seconds.',
        # ── DEV MODE: return OTP so frontend can display it ──────────────────
        'dev_otp': otp_code,
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_otp_verify_view(request):
    """
    POST /api/auth/login/otp/verify/
    Verify OTP and log in the user.
    """
    phone = request.data.get('phone', '').strip()
    otp_code = request.data.get('otp', '').strip()

    if not phone or not otp_code:
        return Response({'success': False, 'message': 'Phone and OTP are required.'}, status=400)

    try:
        otp_record = PhoneOTP.objects.get(phone=phone, purpose='login')
    except PhoneOTP.DoesNotExist:
        return Response({'success': False, 'message': 'OTP not requested. Please request first.'}, status=400)

    if not otp_record.is_valid():
        return Response({'success': False, 'message': 'OTP has expired. Please request a new one.'}, status=400)

    if otp_record.otp != otp_code:
        return Response({'success': False, 'message': 'Invalid OTP. Please check and try again.'}, status=400)

    user = CustomUser.objects.filter(phone=phone).first()
    if not user:
        return Response({'success': False, 'message': 'User not found.'}, status=404)

    tokens = get_tokens_for_user(user)
    profile = UserProfileSerializer(user).data
    otp_record.delete()

    return Response({
        'success': True,
        'message': f'Welcome back, {user.full_name or "friend"}! You are now logged in.',
        'tokens': tokens,
        'user': profile
    })


# ─────────────────────────────────────────────────────────────────────────────
# LOGIN – Password mode (email only)
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_password_view(request):
    """
    POST /api/auth/login/password/
    Login using email + password.
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'errors': serializer.errors}, status=400)

    user = serializer.validated_data['user']
    tokens = get_tokens_for_user(user)
    profile = UserProfileSerializer(user).data
    return Response({
        'success': True,
        'message': f'Welcome back, {user.full_name or "friend"}! You are now logged in.',
        'tokens': tokens,
        'user': profile
    })


# ─────────────────────────────────────────────────────────────────────────────
# EMAIL VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def verify_email_view(request, token):
    """GET /api/auth/verify-email/<token>/"""
    try:
        ev_token = EmailVerificationToken.objects.select_related('user').get(
            token=token,
            token_type=EmailVerificationToken.TOKEN_TYPE_EMAIL_VERIFY
        )
    except EmailVerificationToken.DoesNotExist:
        return Response({'success': False, 'message': 'Invalid verification link.'}, status=404)

    if not ev_token.is_valid():
        return Response({'success': False, 'message': 'Link expired or already used.'}, status=400)

    user = ev_token.user
    user.email_verified = True
    user.save()
    ev_token.used = True
    ev_token.save()

    return Response({'success': True, 'message': 'Email verified successfully!'})


# ─────────────────────────────────────────────────────────────────────────────
# RESEND EMAIL VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resend_verification_email_view(request):
    """
    POST /api/auth/resend-verification/
    Resends the email verification link to the authenticated user.
    Only works if the user has an email that is not yet verified.
    """
    user = request.user
    if not user.email:
        return Response({'success': False, 'message': 'No email address on file.'}, status=400)
    if user.email_verified:
        return Response({'success': False, 'message': 'Email is already verified.'}, status=400)

    # Invalidate any existing tokens
    EmailVerificationToken.objects.filter(
        user=user,
        token_type=EmailVerificationToken.TOKEN_TYPE_EMAIL_VERIFY,
        used=False
    ).update(used=True)

    # Create new token
    token = EmailVerificationToken.objects.create(
        user=user,
        token=uuid.uuid4(),
        token_type=EmailVerificationToken.TOKEN_TYPE_EMAIL_VERIFY,
        expires_at=timezone.now() + timedelta(hours=24),
    )
    sent = EmailService.send_verification_email(user, str(token.token))
    if sent:
        return Response({'success': True, 'message': f'Verification email sent to {user.email}. Please check your inbox.'})
    return Response({'success': False, 'message': 'Failed to send email. Please try again later.'}, status=500)


# ─────────────────────────────────────────────────────────────────────────────
# PROFILE / ADDRESSES
# ─────────────────────────────────────────────────────────────────────────────

class UserProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/profile/"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        old_email = self.request.user.email
        new_email = serializer.validated_data.get('email', old_email)
        
        user = serializer.save()
        if old_email != new_email:
            user.email_verified = False
            user.save(update_fields=['email_verified'])


class UserAddressListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/auth/addresses/"""
    serializer_class = UserAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)


class UserAddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/auth/addresses/<pk>/"""
    serializer_class = UserAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)
