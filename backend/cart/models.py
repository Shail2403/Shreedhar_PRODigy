"""
Shridhar Enterprise – Cart Models
===================================
Session-aware cart supporting:
  - Authenticated users (linked to CustomUser)
  - Guest sessions (session_key, future merge-on-login)
  - Per-item quantity validation against product max_per_order
"""

import uuid
from django.db import models
from django.conf import settings


class Cart(models.Model):
    """
    Shopping cart. Linked to user (if authenticated) or session (guests).
    On login, guest cart should be merged into user cart (future).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='cart'
    )
    session_key = models.CharField(
        max_length=40, null=True, blank=True,
        help_text="Django session key for unauthenticated users"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cart'

    def __str__(self):
        if self.user:
            return f"Cart – {self.user}"
        return f"Guest Cart – {self.session_key}"

    @property
    def total_items(self):
        """Total number of individual items in cart."""
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        """Sum of (selling_price × quantity) for all items."""
        return sum(item.line_total for item in self.items.select_related('product').all())


class CartItem(models.Model):
    """
    Individual line item within a cart.
    Quantity is validated against product's max_per_order on save.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cart Item'
        unique_together = ('cart', 'product')  # One entry per product per cart

    def __str__(self):
        return f"{self.quantity}× {self.product.name}"

    @property
    def line_total(self):
        """Selling price × quantity for this line item."""
        return self.product.selling_price * self.quantity

    def save(self, *args, **kwargs):
        """Clamp quantity to product's max_per_order."""
        if self.product and self.quantity > self.product.max_per_order:
            self.quantity = self.product.max_per_order
        super().save(*args, **kwargs)
