"""Shridhar Enterprise – Orders URL Configuration"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListView.as_view(), name='order-list'),
    path('create/', views.create_order_view, name='order-create'),
    path('paypal/capture/', views.capture_paypal_payment_view, name='paypal-capture'),
    path('<uuid:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
]
