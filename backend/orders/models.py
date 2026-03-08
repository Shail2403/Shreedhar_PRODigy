"""
Shridhar Enterprise – Orders Models
======================================
Complete order management with:
  - Full billing breakdown (subtotal, CGST, SGST, delivery)
  - PayPal payment tracking
  - Order status lifecycle (pending → confirmed → delivered)
  - Per-item tax capture (frozen at order time, not product current rates)
  - Admin-ready: all fields admin can view/modify in future panel
"""

import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Order(models.Model):
    """
    An order placed by a user. Billing totals are calculated and stored
    at order creation time to preserve historical accuracy even if prices change.
    """

    # ── Status Lifecycle ────────────────────────────────────────────────────
    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_PROCESSING = 'processing'
    STATUS_SHIPPED = 'shipped'
    STATUS_DELIVERED = 'delivered'
    STATUS_CANCELLED = 'cancelled'
    STATUS_REFUNDED = 'refunded'

    ORDER_STATUS_CHOICES = [
        (STATUS_PENDING, '⏳ Pending'),
        (STATUS_CONFIRMED, '✅ Confirmed'),
        (STATUS_PROCESSING, '🔧 Processing'),
        (STATUS_SHIPPED, '🚚 Shipped'),
        (STATUS_DELIVERED, '📦 Delivered'),
        (STATUS_CANCELLED, '❌ Cancelled'),
        (STATUS_REFUNDED, '💸 Refunded'),
    ]

    # ── Payment Methods ─────────────────────────────────────────────────────
    PAYMENT_PAYPAL = 'paypal'
    PAYMENT_COD = 'cod'
    PAYMENT_UPI = 'upi'   # Future
    PAYMENT_METHODS = [
        (PAYMENT_PAYPAL, 'PayPal'),
        (PAYMENT_COD, 'Cash on Delivery'),
        (PAYMENT_UPI, 'UPI'),
    ]

    PAYMENT_STATUS_PENDING = 'pending'
    PAYMENT_STATUS_PAID = 'paid'
    PAYMENT_STATUS_FAILED = 'failed'
    PAYMENT_STATUS_REFUNDED = 'refunded'
    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_STATUS_PENDING, 'Pending'),
        (PAYMENT_STATUS_PAID, 'Paid'),
        (PAYMENT_STATUS_FAILED, 'Failed'),
        (PAYMENT_STATUS_REFUNDED, 'Refunded'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='orders')

    # ── Delivery Address (snapshot at order time) ───────────────────────────
    delivery_address = models.ForeignKey(
        'users.UserAddress',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='orders'
    )
    # Snapshot fields in case address is deleted later
    address_snapshot = models.JSONField(null=True, blank=True, help_text="Saved address JSON at order time")

    # ── Billing Breakdown ───────────────────────────────────────────────────
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    cgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_distance_km = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    delivery_charge = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    convenience_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)  # Future
    discount_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)  # Coupons (future)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

    # ── Payment ─────────────────────────────────────────────────────────────
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default=PAYMENT_COD)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_STATUS_PENDING)
    paypal_order_id = models.CharField(max_length=100, blank=True, help_text="PayPal order ID for capture/refund")
    paypal_capture_id = models.CharField(max_length=100, blank=True)

    # ── Status & Notes ──────────────────────────────────────────────────────
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default=STATUS_PENDING)
    customer_notes = models.TextField(blank=True, help_text="Customer's delivery instructions")
    admin_notes = models.TextField(blank=True, help_text="Internal admin notes (not shown to customer)")

    # ── Timestamps ──────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Order'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"Order #{self.order_number} – {self.user}"

    def save(self, *args, **kwargs):
        """Auto-generate sequential order number like SE-20240001."""
        if not self.order_number:
            from django.utils import timezone
            year = timezone.now().year
            prefix = f"SE-{year}"
            last = Order.objects.filter(order_number__startswith=prefix).order_by('-order_number').first()
            if last:
                last_num = int(last.order_number.split('-')[-1])
                self.order_number = f"{prefix}-{str(last_num + 1).zfill(4)}"
            else:
                self.order_number = f"{prefix}-0001"
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    """
    Individual product line within an order.
    Tax rates and price are captured at order time (historical freeze).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, related_name='order_items')
    product_name = models.CharField(max_length=255, help_text="Snapshot of product name at order time")
    product_image_url = models.URLField(blank=True, help_text="Snapshot of product image URL")
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Selling price per unit at order time")
    mrp = models.DecimalField(max_digits=10, decimal_places=2, help_text="MRP at order time")
    cgst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.00, help_text="CGST% at order time")
    sgst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=2.50, help_text="SGST% at order time")

    class Meta:
        verbose_name = 'Order Item'

    def __str__(self):
        return f"{self.quantity}× {self.product_name}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    @property
    def cgst_amount(self):
        return round(self.line_total * self.cgst_rate / 100, 2)

    @property
    def sgst_amount(self):
        return round(self.line_total * self.sgst_rate / 100, 2)
