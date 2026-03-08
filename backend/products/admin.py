"""Shridhar Enterprise – Products Admin Registration"""

from django.contrib import admin
from .models import Category, Brand, Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'sort_order', 'is_active']
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ['is_active']


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'brand', 'selling_price', 'mrp', 'discount_percent', 'stock', 'is_available', 'is_featured']
    list_filter = ['is_available', 'is_featured', 'is_new_arrival', 'is_bestseller', 'category', 'brand']
    search_fields = ['name', 'sku']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['selling_price', 'stock', 'is_available', 'is_featured']
    readonly_fields = ['discount_percent', 'created_at', 'updated_at']
    inlines = [ProductImageInline]
    fieldsets = (
        ('Identity', {'fields': ('name', 'slug', 'sku', 'category', 'brand')}),
        ('Description', {'fields': ('short_description', 'description', 'ingredients', 'nutritional_info', 'allergens', 'shelf_life')}),
        ('Sizing', {'fields': ('quantity_unit', 'weight', 'pack_size')}),
        ('Pricing', {'fields': ('mrp', 'selling_price', 'discount_percent')}),
        ('Taxes', {'fields': ('cgst_rate', 'sgst_rate')}),
        ('Inventory', {'fields': ('stock', 'max_per_order', 'is_available')}),
        ('Ratings', {'fields': ('rating', 'review_count', 'country_of_origin', 'is_veg')}),
        ('Display Flags', {'fields': ('is_featured', 'is_new_arrival', 'is_bestseller', 'sort_order')}),
        ('SEO', {'fields': ('meta_title', 'meta_description')}),
        ('Audit', {'fields': ('created_at', 'updated_at')}),
    )
