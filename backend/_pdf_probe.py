import os, django
from datetime import datetime
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "learnsphere.settings")
django.setup()

from utils.pdf import generate_certificate_pdf

path = generate_certificate_pdf(
    employee_name="Jane Trainee",
    course_name="Cybersecurity Fundamentals",
    completion_date=datetime.now(),
    certificate_id=99999,
)
print("PDF written to:", path)
print("Size:", os.path.getsize(path), "bytes")
print("Exists:", os.path.exists(path))
