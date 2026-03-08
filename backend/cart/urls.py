"""Shridhar Enterprise – Cart URL Configuration"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.cart_detail_view, name='cart-detail'),
    path('add/', views.add_to_cart_view, name='cart-add'),
    path('clear/', views.clear_cart_view, name='cart-clear'),
    path('items/<uuid:item_id>/', views.update_cart_item_view, name='cart-item-update'),
    path('items/<uuid:item_id>/remove/', views.remove_cart_item_view, name='cart-item-remove'),
]
