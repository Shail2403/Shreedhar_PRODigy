"""
Shridhar Enterprise – Products Models
=======================================
Complete product catalog schema inspired by Zepto and Indian e-commerce norms.
Supports:
  - Multi-brand, multi-category hierarchy
  - Dynamic pricing (MRP, selling price, discount %)
  - Rich product details (ingredients, nutrition, allergens)
  - Tax configuration per product (CGST/SGST defaults: 5%/2.5%)
  - Admin-controlled stock, quantities, availability
  - Future: location-based product visibility, admin price override
"""

import uuid
from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    """
    Top-level product category (e.g., Spices & Masala, Khakhras, Ice Cream).
    Admin can reorder categories and toggle visibility.
    Future: location-based category visibility.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, blank=True, help_text="Emoji icon for category pill tab")
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0, help_text="Lower = appears first")
    is_active = models.BooleanField(default=True)
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Brand(models.Model):
    """
    Product brand/manufacturer. Allows admin to group, filter, and promote brands.
    Future: brand-specific discounts and promotions.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='brands/', null=True, blank=True)
    website = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Brand'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    """
    Core product model. Every field is designed for:
      1. Zepto-parity display (MRP, price, discount badge, ratings)
      2. Admin-control (future panel will modify prices, stock, discounts)
      3. Tax-per-product overrides (CGST/SGST default 5%/2.5%)
      4. Rich content (ingredients, nutritional info as JSON)
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ── Identity ────────────────────────────────────────────────────────────
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    sku = models.CharField(max_length=50, unique=True, blank=True, help_text="Stock Keeping Unit")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')

    # ── Description ─────────────────────────────────────────────────────────
    short_description = models.CharField(max_length=300, blank=True, help_text="Shown on product card")
    description = models.TextField(blank=True, help_text="Full HTML description")
    ingredients = models.TextField(blank=True)
    nutritional_info = models.JSONField(
        null=True, blank=True,
        help_text="JSON: {calories: 120, protein: 2g, ...}"
    )
    allergens = models.CharField(max_length=255, blank=True, help_text="e.g. Contains: Peanuts, Wheat")
    shelf_life = models.CharField(max_length=100, blank=True, help_text="e.g. 6 months from manufacture date")

    # ── Sizing / Packaging / Options ─────────────────────────────────────────
    quantity_unit = models.CharField(max_length=30, default='piece', help_text="g, kg, ml, L, piece, pack")
    weight = models.CharField(max_length=50, blank=True, help_text="e.g. 200g, 500ml")
    pack_size = models.CharField(max_length=50, blank=True, help_text="e.g. Pack of 5, Box of 12")
    options = models.JSONField(
        default=dict, blank=True,
        help_text="JSON: {'Size': ['200g', '500g'], 'Flavor': ['Spicy', 'Mild']}"
    )
    original_url = models.URLField(max_length=1000, blank=True)

    # ── Pricing ─────────────────────────────────────────────────────────────
    mrp = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    # discount_percent is auto-calculated in save() but can be admin-overridden
    discount_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # ── Taxation (per-product, admin-modifiable) ────────────────────────────
    cgst_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=5.00,
        help_text="CGST percentage (default 5%)"
    )
    sgst_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=2.50,
        help_text="SGST percentage (default 2.5%)"
    )

    # ── Inventory ───────────────────────────────────────────────────────────
    stock = models.PositiveIntegerField(default=100)
    max_per_order = models.PositiveIntegerField(
        default=10,
        help_text="Maximum units a customer can order in one transaction. Admin-controllable."
    )
    is_available = models.BooleanField(default=True, help_text="Admin can toggle to hide product.")

    # ── Ratings ─────────────────────────────────────────────────────────────
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.0,
                                  validators=[MinValueValidator(0), MaxValueValidator(5)])
    review_count = models.PositiveIntegerField(default=0)

    # ── Flags for UI ────────────────────────────────────────────────────────
    is_featured = models.BooleanField(default=False, help_text="Shown in featured section on homepage")
    is_new_arrival = models.BooleanField(default=False)
    is_bestseller = models.BooleanField(default=False)
    is_veg = models.BooleanField(default=True, help_text="Veg/Non-veg indicator (green/red dot)")
    country_of_origin = models.CharField(max_length=100, default='India')

    # ── SEO ─────────────────────────────────────────────────────────────────
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)

    # ── Timestamps ──────────────────────────────────────────────────────────
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Product'
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_available', 'is_featured']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"{self.name} ({self.weight})"

    def save(self, *args, **kwargs):
        """Auto-calculate discount percentage and generate slug/SKU if missing."""
        # Auto-slug from name
        if not self.slug:
            base_slug = slugify(self.name)
            self.slug = base_slug
            # Ensure uniqueness
            counter = 1
            while Product.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{base_slug}-{counter}"
                counter += 1

        # Auto-SKU
        if not self.sku:
            self.sku = f"SE-{str(self.id)[:8].upper()}"

        # Auto-calculate discount percent from MRP vs selling price
        if self.mrp > 0:
            self.discount_percent = round(((self.mrp - self.selling_price) / self.mrp) * 100, 2)

        super().save(*args, **kwargs)

    @property
    def savings(self):
        """Amount saved vs MRP."""
        return self.mrp - self.selling_price


class ProductImage(models.Model):
    """
    Multiple images per product. First image (sort_order=0) is the primary/thumbnail.
    Supports multiple angles, as seen on Zepto product detail pages.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0, help_text="0 = primary/thumbnail")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return f"Image {self.sort_order} for {self.product.name}"
