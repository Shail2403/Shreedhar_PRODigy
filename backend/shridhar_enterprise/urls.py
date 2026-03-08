"""
Shridhar Enterprise – Root URL Configuration
===============================================
All API routes are prefixed with /api/
Static and media files served in development.
Admin panel included for Django admin (separate from future Shridhar custom admin).
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

def health_check(request):
    return HttpResponse("<h2>🚀 Shridhar Enterprise Backend is LIVE!</h2>", content_type="text/html")

# ── Admin customization ───────────────────────────────────────────────────────
admin.site.site_header = "Shridhar Enterprise Administration"
admin.site.site_title = "Shridhar Enterprise Admin"
admin.site.index_title = "Welcome to Shridhar Enterprise Admin Panel"

urlpatterns = [
    # Django superuser admin
    path('django-admin/', admin.site.urls),

    # ── API Routes ──────────────────────────────────────────────────────────
    path('api/auth/', include('users.urls')),
    path('api/products/', include('products.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/orders/', include('orders.urls')),
    path('', health_check), # Root success message
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
