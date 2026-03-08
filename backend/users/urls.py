"""
Shridhar Enterprise – Users URL Configuration
===============================================
All /api/auth/ routes for authentication and user management.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # ── Authentication ──────────────────────────────────────────────────────
    # Signup Flow (Strict OTP first)
    path('signup/initiate/', views.signup_initiate_view, name='auth-signup-initiate'),
    path('signup/verify/', views.signup_verify_view, name='auth-signup-verify'),
    
    # Login Flow (Dual Mode)
    path('login/otp/initiate/', views.login_otp_initiate_view, name='auth-login-otp-initiate'),
    path('login/otp/verify/', views.login_otp_verify_view, name='auth-login-otp-verify'),
    path('login/password/', views.login_password_view, name='auth-login-password'),
    
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # ── Email Verification ──────────────────────────────────────────────────
    path('verify-email/<str:token>/', views.verify_email_view, name='auth-verify-email'),
    path('resend-verification/', views.resend_verification_email_view, name='auth-resend-verification'),

    # ── Profile ─────────────────────────────────────────────────────────────
    path('profile/', views.UserProfileView.as_view(), name='auth-profile'),

    # ── Addresses ───────────────────────────────────────────────────────────
    path('addresses/', views.UserAddressListCreateView.as_view(), name='auth-addresses'),
    path('addresses/<uuid:pk>/', views.UserAddressDetailView.as_view(), name='auth-address-detail'),

    # ── Location Services ─────────────────────────────────────────────────────
    path('reverse-geocode/', views.reverse_geocode_view, name='auth-reverse-geocode'),
]
