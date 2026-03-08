"""
Shridhar Enterprise – Cart Serializers
====================================
Serializers for Cart and CartItem models.
Provides nested representation used by cart API endpoints.
"""
from rest_framework import serializers
from .models import Cart, CartItem


from products.serializers import ProductListSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'quantity', 'line_total', 'added_at'
        ]
        read_only_fields = ['id', 'product', 'added_at', 'line_total']

    def get_line_total(self, obj):
        return float(round(obj.quantity * obj.product.selling_price, 2))


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'created_at', 'updated_at', 'items']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'items']
