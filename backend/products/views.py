"""
Shridhar Enterprise – Products Views
======================================
Product catalog API endpoints supporting:
  - Listing with search, category filter, brand filter, sort
  - Featured products for homepage
  - Categories for navigation bar
  - Delivery charge calculator using Google Maps + geopy
"""

from django.conf import settings
from rest_framework import generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import math

from .models import Category, Brand, Product
from .serializers import CategorySerializer, BrandSerializer, ProductListSerializer, ProductDetailSerializer


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate straight-line distance (km) between two coordinates using Haversine formula.
    Used for delivery charge calculation: ₹10 per km from shop location.
    For production: replace with Google Maps Distance Matrix API for road distance.
    """
    R = 6371  # Earth's radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


class CategoryListView(generics.ListAPIView):
    """
    GET /api/products/categories/
    Returns active categories sorted for navbar display.
    """
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = Category.objects.filter(is_active=True).order_by('sort_order', 'name')


class BrandListView(generics.ListAPIView):
    """GET /api/products/brands/ – active brands for filtering."""
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Brand.objects.filter(is_active=True)


class ProductListView(generics.ListAPIView):
    """
    GET /api/products/
    Query params:
      - category=<slug>        filter by category
      - brand=<slug>           filter by brand
      - search=<q>             name/description search
      - featured=true          featured products only
      - new_arrival=true       new arrivals only
      - ordering=selling_price,-rating,name  sort
    """
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'short_description', 'description', 'brand__name', 'category__name', 'ingredients']
    ordering_fields = ['selling_price', 'rating', 'name', 'discount_percent', 'sort_order', 'created_at']
    ordering = ['-is_featured', '-is_bestseller', 'sort_order', 'name']

    def get_queryset(self):
        qs = Product.objects.all().select_related('category', 'brand').prefetch_related('images')

        # Availability filter
        availability = self.request.query_params.get('availability', 'all')
        if availability == 'in_stock':
            qs = qs.filter(is_available=True, stock_quantity__gt=0)
        elif availability == 'all':
            # Default to active products only for guest/listing
            qs = qs.filter(is_available=True)

        category_slug = self.request.query_params.get('category')
        if category_slug:
            qs = qs.filter(category__slug=category_slug)

        brand_slug = self.request.query_params.get('brand')
        if brand_slug:
            qs = qs.filter(brand__slug=brand_slug)

        # Price range
        min_price = self.request.query_params.get('min_price')
        if min_price:
            qs = qs.filter(selling_price__gte=min_price)
        
        max_price = self.request.query_params.get('max_price')
        if max_price:
            qs = qs.filter(selling_price__lte=max_price)

        if self.request.query_params.get('featured') == 'true':
            qs = qs.filter(is_featured=True)

        if self.request.query_params.get('new_arrival') == 'true':
            qs = qs.filter(is_new_arrival=True)

        if self.request.query_params.get('bestseller') == 'true':
            qs = qs.filter(is_bestseller=True)

        # Ordering
        sort = self.request.query_params.get('sort')
        if sort == 'price_low':
            qs = qs.order_by('selling_price')
        elif sort == 'price_high':
            qs = qs.order_by('-selling_price')
        elif sort == 'newest':
            qs = qs.order_by('-created_at')
        else:
            qs = qs.order_by('sort_order', '-created_at')

        return qs


class ProductDetailView(generics.RetrieveAPIView):
    """GET /api/products/<slug>/ – full product detail."""
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    queryset = Product.objects.filter(is_available=True).select_related('category', 'brand').prefetch_related('images')


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def homepage_data_view(request):
    """
    GET /api/products/homepage/
    ─────────────────────────────────────────────────────────────────
    Aggregated data for homepage in one API call to minimize roundtrips.
    Returns: featured, new arrivals, bestsellers, categories.
    """
    context = {'request': request}

    categories = Category.objects.filter(is_active=True).order_by('sort_order')[:12]
    featured = Product.objects.filter(is_available=True, is_featured=True).select_related('category', 'brand').prefetch_related('images')[:12]
    new_arrivals = Product.objects.filter(is_available=True, is_new_arrival=True).select_related('category', 'brand').prefetch_related('images')[:12]
    bestsellers = Product.objects.filter(is_available=True, is_bestseller=True).select_related('category', 'brand').prefetch_related('images')[:12]

    return Response({
        'categories': CategorySerializer(categories, many=True, context=context).data,
        'featured': ProductListSerializer(featured, many=True, context=context).data,
        'new_arrivals': ProductListSerializer(new_arrivals, many=True, context=context).data,
        'bestsellers': ProductListSerializer(bestsellers, many=True, context=context).data,
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def calculate_delivery_view(request):
    """
    POST /api/products/calculate-delivery/
    Body: { "latitude": 23.02, "longitude": 72.57 }
    ─────────────────────────────────────────────────────────────────
    Calculates delivery charge (₹10/km) from shop to customer location.
    Shop location: Chamunda Nagar, Ahmedabad (from settings).
    """
    lat = request.data.get('latitude')
    lng = request.data.get('longitude')

    if not lat or not lng:
        return Response({'error': 'latitude and longitude are required.'}, status=400)

    try:
        distance_km = haversine_distance(
            settings.SHOP_LATITUDE, settings.SHOP_LONGITUDE,
            float(lat), float(lng)
        )
        if distance_km >= 1:
            delivery_charge = round(distance_km * 10, 2)
        else:
            delivery_charge = 0
        
        return Response({
            'distance_km': round(distance_km, 2),
            'delivery_charge': delivery_charge,
            'rate_per_km': 10 if distance_km >= 1 else 0,
            'shop_location': settings.SHOP_LATITUDE,
            'free_delivery': distance_km < 1
        })
    except (ValueError, TypeError) as e:
        return Response({'error': f'Invalid coordinates: {e}'}, status=400)
