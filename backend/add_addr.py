import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shridhar_enterprise.settings')
django.setup()
from users.models import CustomUser, UserAddress

try:
    u = CustomUser.objects.get(phone='+91sec_prod_1gy')
except CustomUser.DoesNotExist:
    u = CustomUser.objects.get(phone='+sec_prod_1gy')

if not u.addresses.exists():
    UserAddress.objects.create(
        user=u, label='Home', recipient_name='Super User', phone=u.phone,
        line1='123 Test St', city='Ahmedabad', state='Gujarat', pincode='380001',
        is_default=True
    )
    print("Address created.")
else:
    print("Address exists.")
