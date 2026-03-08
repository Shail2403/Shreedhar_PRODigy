"""
Shridhar Enterprise – Cart Views
===================================
Cart API endpoints supporting authenticated users.
All operations return full cart with updated billing snapshot.
"""

from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from products.models import Product
from products.views import haversine_distance
from users.models import UserAddress
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
import decimal
import math

def calculate_billing(cart, delivery_charge=decimal.Decimal('0.00')):
    """
    Calculate billing breakdown for cart.
    CGST 5% + SGST 2.5% on subtotal. Delivery ₹10/km.
    Returns dict used by BillingSummary component on frontend.
    """
    subtotal = decimal.Decimal('0.00')
    cgst = decimal.Decimal('0.00')
    sgst = decimal.Decimal('0.00')

    for item in cart.items.select_related('product').all():
        item_total = item.product.selling_price * item.quantity
        subtotal += item_total
        cgst += item_total * item.product.cgst_rate / 100
        sgst += item_total * item.product.sgst_rate / 100

    cgst = cgst.quantize(decimal.Decimal('0.01'))
    sgst = sgst.quantize(decimal.Decimal('0.01'))
    total = subtotal + cgst + sgst + delivery_charge

    return {
        'subtotal': float(subtotal),
        'cgst_amount': float(cgst),
        'cgst_rate': 5.00,
        'sgst_amount': float(sgst),
        'sgst_rate': 2.50,
        'delivery_charge': float(delivery_charge),
        'total': float(total),
        'item_count': sum(i.quantity for i in cart.items.all()),
    }

def get_or_create_cart(user):
    """Get or create a cart for the authenticated user."""
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart

def serialize_cart(cart, request, delivery_charge=None):
    """
    Returns a unified cart JSON with items and billing summary.
    If delivery_charge is None, tries to calculate from user's default address.
    """
    if delivery_charge is None and request.user.is_authenticated:
        default_addr = UserAddress.objects.filter(user=request.user, is_default=True).first()
        if default_addr and default_addr.latitude and default_addr.longitude:
            try:
                dist = haversine_distance(
                    settings.SHOP_LATITUDE, settings.SHOP_LONGITUDE,
                    float(default_addr.latitude), float(default_addr.longitude)
                )
                delivery_charge = decimal.Decimal(str(round(dist * 10, 2))) if dist >= 1 else decimal.Decimal('0')
            except (ValueError, TypeError):
                delivery_charge = decimal.Decimal('0')
    
    if delivery_charge is None:
        delivery_charge = decimal.Decimal('0')

    items = cart.items.all().select_related('product').prefetch_related('product__images')
    billing = calculate_billing(cart, delivery_charge)
    
    return {
        'id': str(cart.id),
        'items': CartItemSerializer(items, many=True, context={'request': request}).data,
        'billing': billing
    }

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def cart_detail_view(request):
    """GET /api/cart/ – retrieve current user's cart with billing."""
    cart = get_or_create_cart(request.user)
    charge_raw = request.query_params.get('delivery_charge')
    delivery_charge = decimal.Decimal(charge_raw) if charge_raw else None
    return Response(serialize_cart(cart, request, delivery_charge))

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_to_cart_view(request):
    """POST /api/cart/add/ - Adds item and returns updated cart."""
    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))

    try:
        product = Product.objects.get(id=product_id, is_available=True)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=404)

    cart = get_or_create_cart(request.user)
    item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={'quantity': 0})
    item.quantity = min(item.quantity + quantity, product.max_per_order)
    item.save()

    charge_raw = request.data.get('delivery_charge', request.query_params.get('delivery_charge'))
    delivery_charge = decimal.Decimal(str(charge_raw)) if charge_raw else None
    
    return Response({
        'success': True,
        'cart': serialize_cart(cart, request, delivery_charge),
    })

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_cart_item_view(request, item_id):
    """PATCH /api/cart/items/<item_id>/ - Update quantity."""
    try:
        item = CartItem.objects.get(id=item_id, cart__user=request.user)
    except CartItem.DoesNotExist:
        return Response({'error': 'Item not found.'}, status=404)

    quantity = int(request.data.get('quantity', 1))
    if quantity <= 0:
        item.delete()
    else:
        item.quantity = min(quantity, item.product.max_per_order)
        item.save()

    cart = get_or_create_cart(request.user)
    charge_raw = request.data.get('delivery_charge', request.query_params.get('delivery_charge'))
    delivery_charge = decimal.Decimal(str(charge_raw)) if charge_raw else None
    return Response({'success': True, 'cart': serialize_cart(cart, request, delivery_charge)})

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_cart_item_view(request, item_id):
    """DELETE /api/cart/items/<item_id>/remove/"""
    try:
        item = CartItem.objects.get(id=item_id, cart__user=request.user)
        item.delete()
    except CartItem.DoesNotExist:
        pass

    cart = get_or_create_cart(request.user)
    charge_raw = request.data.get('delivery_charge', request.query_params.get('delivery_charge'))
    delivery_charge = decimal.Decimal(str(charge_raw)) if charge_raw else None
    return Response({'success': True, 'cart': serialize_cart(cart, request, delivery_charge)})

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def clear_cart_view(request):
    """DELETE /api/cart/clear/"""
    cart = get_or_create_cart(request.user)
    cart.items.all().delete()
    return Response({'success': True, 'cart': serialize_cart(cart, request)})
