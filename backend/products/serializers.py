"""
Shridhar Enterprise – Products Serializers
============================================
Serializers for product catalog API endpoints.
Provides full Zepto-parity data including pricing, discounts, ratings, images.
"""

from rest_framework import serializers
from .models import Category, Brand, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    """Lightweight category data for navigation tabs."""
    sample_image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'image', 'sort_order', 'sample_image']

    def get_sample_image(self, obj):
        request = self.context.get('request')
        # fallback to a product's primary image
        p = obj.products.filter(images__isnull=False).first()
        if p:
            image = p.images.filter(sort_order=0).first()
            if image and image.image:
                return request.build_absolute_uri(image.image.url) if request else image.image.url
        return None


class BrandSerializer(serializers.ModelSerializer):
    """Brand info for product cards and filtering."""

    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo']


class ProductImageSerializer(serializers.ModelSerializer):
    """Product image with alt text for accessible display."""

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'sort_order']


class ProductListSerializer(serializers.ModelSerializer):
    """
    Compact serializer for product grid / listing pages.
    Includes all data needed for Zepto-style product cards.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    savings = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'weight', 'pack_size',
            'category_name', 'brand_name',
            'mrp', 'selling_price', 'discount_percent', 'savings',
            'cgst_rate', 'sgst_rate',
            'rating', 'review_count',
            'is_available', 'is_featured', 'is_new_arrival', 'is_bestseller',
            'is_veg', 'stock', 'max_per_order',
            'primary_image',
        ]

    def get_primary_image(self, obj):
        """Return URL of the first (sort_order=0) image."""
        image = obj.images.filter(sort_order=0).first()
        if image and image.image:
            request = self.context.get('request')
            return request.build_absolute_uri(image.image.url) if request else image.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """
    Full product data for detail modal/page.
    Includes all images, full description, ingredients, nutrition.
    """
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    savings = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku',
            'category', 'brand',
            'short_description', 'description', 'ingredients',
            'nutritional_info', 'allergens', 'shelf_life',
            'weight', 'pack_size', 'quantity_unit',
            'mrp', 'selling_price', 'discount_percent', 'savings',
            'cgst_rate', 'sgst_rate',
            'stock', 'max_per_order', 'is_available',
            'rating', 'review_count',
            'is_featured', 'is_new_arrival', 'is_bestseller', 'is_veg',
            'country_of_origin',
            'images',
            'created_at', 'updated_at',
        ]
