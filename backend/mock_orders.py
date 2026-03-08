import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shridhar_enterprise.settings')
django.setup()

from users.models import CustomUser, UserAddress
from products.models import Product
from orders.models import Order, OrderItem

u = CustomUser.objects.get(phone='+919999999999')
addr = u.addresses.filter(is_default=True).first()
products = list(Product.objects.all()[:3])

if not addr or not products:
    print("Missing addr or products")
    exit(1)

# Order 1: COD
o1 = Order.objects.create(
    user=u,
    address_snapshot={
        'recipient_name': addr.recipient_name,
        'line1': addr.line1,
        'line2': addr.line2,
        'city': addr.city,
        'state': addr.state,
        'pincode': addr.pincode,
        'phone': str(addr.phone)
    },
    subtotal=products[0].selling_price * 2,
    total_amount=products[0].selling_price * 2 + 10,
    delivery_charge=10,
    payment_method='cod',
    payment_status='pending',
    status='pending',
    customer_notes='Please ring the bell.'
)
OrderItem.objects.create(
    order=o1,
    product=products[0],
    product_name=products[0].name,
    product_image_url='',
    quantity=2,
    unit_price=products[0].selling_price,
    mrp=products[0].mrp,
    cgst_rate=5.00,
    sgst_rate=2.50
)

# Order 2: PayPal
sub = products[1].selling_price + products[2].selling_price
o2 = Order.objects.create(
    user=u,
    address_snapshot={
        'recipient_name': addr.recipient_name,
        'line1': addr.line1,
        'line2': addr.line2,
        'city': addr.city,
        'state': addr.state,
        'pincode': addr.pincode,
        'phone': str(addr.phone)
    },
    subtotal=sub,
    total_amount=sub,
    delivery_charge=0,
    payment_method='paypal',
    payment_status='completed',
    status='confirmed',
    paypal_order_id='PAYID-MOCKXYZ123ABC'
)
OrderItem.objects.create(
    order=o2,
    product=products[1],
    product_name=products[1].name,
    product_image_url='',
    quantity=1,
    unit_price=products[1].selling_price,
    mrp=products[1].mrp,
    cgst_rate=5.00,
    sgst_rate=2.50
)
OrderItem.objects.create(
    order=o2,
    product=products[2],
    product_name=products[2].name,
    product_image_url='',
    quantity=1,
    unit_price=products[2].selling_price,
    mrp=products[2].mrp,
    cgst_rate=5.00,
    sgst_rate=2.50
)

print("Mock orders created successfully.")
