"""
Shridhar Enterprise – Users Admin Registration
================================================
Registers all user models in Django admin.
Future: These registrations serve as the foundation for the custom admin panel.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomUser, EmailVerificationToken, UserAddress


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    """Admin view for CustomUser – fully manageable from Django admin."""
    list_display = ['phone', 'full_name', 'email', 'email_verified', 'is_admin', 'is_active', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'is_admin', 'email_verified', 'is_india']
    search_fields = ['phone__icontains', 'email', 'full_name']
    ordering = ['-date_joined']
    readonly_fields = ['id', 'date_joined', 'last_login_ip']

    fieldsets = (
        ('Identity', {'fields': ('id', 'phone', 'email', 'full_name', 'profile_picture')}),
        ('Authentication', {'fields': ('password',)}),
        ('Location & Contact', {'fields': ('country_code', 'is_india')}),
        ('Email Verification', {'fields': ('email_verified', 'email_verification_sent_at')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_admin', 'is_superuser', 'groups', 'user_permissions')}),
        ('Preferences', {'fields': ('receive_newsletters',)}),
        ('Audit', {'fields': ('date_joined', 'last_login_ip')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'password1', 'password2', 'full_name', 'email'),
        }),
    )


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token_type', 'created_at', 'expires_at', 'used']
    list_filter = ['token_type', 'used']
    search_fields = ['user__phone__icontains', 'user__email']


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'label', 'recipient_name', 'city', 'is_default']
    search_fields = ['user__phone__icontains', 'city', 'recipient_name']
    list_filter = ['is_default', 'city']
