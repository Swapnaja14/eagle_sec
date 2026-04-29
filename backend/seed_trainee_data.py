
import os
import django
import uuid
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
# Add local packages to path if needed (using the path discovered earlier)
import sys
local_packages = os.path.expandvars(r'%LOCALAPPDATA%\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages')
if os.path.exists(local_packages):
    sys.path.insert(0, local_packages)
# Also add the standard local site-packages just in case
sys.path.append(r"C:\Users\sonta\.local\lib\python3.12-mingw_x86_64_ucrt_gnu\site-packages")

django.setup()

from accounts.models import User, Tenant
from courses.models import Course, TrainingAssignment
from assessments.models import Quiz, Submission
from certificates.models import IssuedCertificate
from utils.pdf import generate_certificate_pdf

def seed_trainee_data():
    print("🌱 Seeding trainee data (assignments & certificates)...")
    
    try:
        trainee = User.objects.get(username='trainee')
        tenant = trainee.tenant
        if not tenant:
            tenant = Tenant.objects.first()
            trainee.tenant = tenant
            trainee.save()
    except User.DoesNotExist:
        print("❌ Error: Trainee user not found. Run seed_sample_data first.")
        return

    # Get all active courses
    courses = list(Course.objects.all())
    if len(courses) < 5:
        print(f"❌ Error: Not enough courses found (found {len(courses)}). Need at least 5.")
        return

    # Clear existing assignments for this trainee to start fresh
    TrainingAssignment.objects.filter(trainee=trainee).delete()
    IssuedCertificate.objects.filter(employee=trainee).delete()
    Submission.objects.filter(user=trainee).delete()

    # 1. Two Completed Courses with Certificates
    completed_courses = courses[:2]
    for course in completed_courses:
        # Create assignment
        assignment = TrainingAssignment.objects.create(
            tenant=tenant,
            trainee=trainee,
            course=course,
            status=TrainingAssignment.STATUS_COMPLETED,
            assigned_at=datetime.now() - timedelta(days=30),
            due_date=(datetime.now() - timedelta(days=10)).date()
        )
        
        # Create/Get Quiz
        quiz, _ = Quiz.objects.get_or_create(
            tenant=tenant,
            course=course,
            defaults={
                'title': f"Final Quiz for {course.display_name}",
                'passing_score': 70,
                'is_active': True
            }
        )
        
        # Create Submission
        submission = Submission.objects.create(
            user=trainee,
            quiz=quiz,
            status='completed',
            score=85.0,
            total_points=100,
            percentage=85.0,
            passed=True,
            submitted_at=datetime.now() - timedelta(days=5)
        )
        
        # Create Certificate record
        cert = IssuedCertificate.objects.create(
            tenant=tenant,
            employee=trainee,
            course=course,
            submission=submission,
            file_path="",  # Will update after generation
            issued_at=datetime.now() - timedelta(days=5)
        )
        
        # Generate real PDF
        employee_name = f"{trainee.first_name} {trainee.last_name}".strip() or trainee.username
        pdf_path = generate_certificate_pdf(
            employee_name=employee_name,
            course_name=course.display_name,
            completion_date=submission.submitted_at,
            certificate_id=cert.id
        )
        
        cert.file_path = pdf_path
        cert.save()
        
        print(f"✅ Completed: {course.display_name} (PDF Generated)")

    # 2. Three Running (In Progress) Courses
    running_courses = courses[2:5]
    for course in running_courses:
        TrainingAssignment.objects.create(
            tenant=tenant,
            trainee=trainee,
            course=course,
            status=TrainingAssignment.STATUS_IN_PROGRESS,
            assigned_at=datetime.now() - timedelta(days=5),
            due_date=(datetime.now() + timedelta(days=25)).date()
        )
        print(f"🏃 Running: {course.display_name}")

    print("\n✨ Trainee data seeding completed!")
    print("   - 2 Courses Completed with Certificates")
    print("   - 3 Courses In Progress")

if __name__ == "__main__":
    seed_trainee_data()
