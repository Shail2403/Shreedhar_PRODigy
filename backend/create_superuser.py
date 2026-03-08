import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shridhar_enterprise.settings')
django.setup()

from users.models import CustomUser

username = 'sec_prod_1gy'
password = 'sec_prod_1gy'
email = 'sec_prod_1gy@example.com'

if not CustomUser.objects.filter(username=username).exists():
    CustomUser.objects.create_superuser(username=username, email=email, password=password)
    print(f"Superuser {username} created successfully.")
else:
    user = CustomUser.objects.get(username=username)
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.save()
    print(f"Superuser {username} updated successfully.")
