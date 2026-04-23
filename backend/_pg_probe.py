import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "learnsphere.settings")
django.setup()
from django.contrib.auth import get_user_model
from courses.models import Course
from accounts.models import Tenant
U = get_user_model()
print("tenants:", Tenant.objects.count())
print("users:", U.objects.count())
for u in U.objects.all()[:10]:
    print(" -", u.username, "role=", getattr(u, "role", "?"))
print("courses:", Course.objects.count())
for c in Course.objects.all()[:15]:
    print(" -", c.id, c.display_name, "status=", c.status)
