"""Shridhar Enterprise – Orders Admin Registration"""

from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'quantity', 'unit_price', 'cgst_rate', 'sgst_rate']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'payment_method', 'payment_status', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_method', 'payment_status']
    search_fields = ['order_number', 'user__phone__icontains']
    readonly_fields = ['id', 'order_number', 'created_at', 'updated_at']
    inlines = [OrderItemInline]
