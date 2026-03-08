"""
Shridhar Enterprise – Products URL Configuration
"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProductListView.as_view(), name='product-list'),
    path('homepage/', views.homepage_data_view, name='product-homepage'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('brands/', views.BrandListView.as_view(), name='brand-list'),
    path('calculate-delivery/', views.calculate_delivery_view, name='calculate-delivery'),
    path('<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),
]
