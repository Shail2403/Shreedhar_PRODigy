import os
import django
from django.core.exceptions import ValidationError

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shridhar_enterprise.settings')
django.setup()

from users.models import CustomUser

username = 'sec_prod_1gy'
password = 'sec_prod_1gy'

try:
    user, created = CustomUser.objects.get_or_create(phone=username)
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.is_admin = True
    user.save()
    print(f"User {username} created/updated successfully.")
except Exception as e:
    print(f"Error: {e}")
