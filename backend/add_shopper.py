import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shridhar_enterprise.settings')
django.setup()
from users.models import CustomUser, UserAddress

# Create a valid phone/email user for checkout
u, created = CustomUser.objects.get_or_create(
    phone='+919999999999',
    defaults={
        'email': 'test@example.com',
        'full_name': 'Test User'
    }
)
u.set_password('password123')
u.save()

if not u.addresses.exists():
    UserAddress.objects.create(
        user=u, label='Home', recipient_name='Test User', phone=u.phone,
        line1='123 Test St', city='Ahmedabad', state='Gujarat', pincode='380001',
        is_default=True
    )
    print("User and Addr created.")
else:
    print("User and Addr exist.")
