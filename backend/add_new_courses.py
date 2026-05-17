
import os
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
import sys
local_packages = os.path.expandvars(r'%LOCALAPPDATA%\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages')
if os.path.exists(local_packages):
    sys.path.insert(0, local_packages)
sys.path.append(r"C:\Users\sonta\.local\lib\python3.12-mingw_x86_64_ucrt_gnu\site-packages")

django.setup()

from accounts.models import User, Tenant
from courses.models import Course, Lesson

def add_new_courses():
    print("📚 Adding new courses to the catalog...")
    
    tenant = Tenant.objects.first()
    admin = User.objects.filter(role='admin').first()
    
    new_courses = [
        {
            'display_name': 'Advanced Malware Analysis',
            'description': 'Deep dive into malware analysis techniques, reverse engineering, and behavior monitoring.',
            'compliance_taxonomy': 'NIST',
            'skills_taxonomy': 'Threat Analysis',
            'lessons': ['Static Analysis', 'Dynamic Analysis', 'Reverse Engineering Basics']
        },
        {
            'display_name': 'Zero Trust Architecture',
            'description': 'Learn how to implement a Zero Trust security model in your organization.',
            'compliance_taxonomy': 'SOC2',
            'skills_taxonomy': 'Cloud Architecture',
            'lessons': ['Principles of Zero Trust', 'Identity-Centric Security', 'Micro-segmentation']
        },
        {
            'display_name': 'AI Security & Ethics',
            'description': 'Understanding the security risks associated with AI/ML models and ensuring ethical implementation.',
            'compliance_taxonomy': 'none',
            'skills_taxonomy': 'none',
            'lessons': ['Adversarial Attacks on AI', 'Data Privacy in ML', 'Ethical AI Frameworks']
        }
    ]
    
    for c_data in new_courses:
        course, created = Course.objects.get_or_create(
            display_name=c_data['display_name'],
            defaults={
                'tenant': tenant,
                'created_by': admin,
                'description': c_data['description'],
                'compliance_taxonomy': c_data['compliance_taxonomy'],
                'skills_taxonomy': c_data['skills_taxonomy'],
                'status': 'active'
            }
        )
        
        if created:
            for i, lesson_title in enumerate(c_data['lessons']):
                Lesson.objects.create(
                    course=course,
                    title=lesson_title,
                    order=i+1
                )
            print(f"✅ Created: {course.display_name}")
        else:
            print(f"ℹ️ Already exists: {course.display_name}")

    print("\n✨ Catalog update completed!")

if __name__ == "__main__":
    add_new_courses()
