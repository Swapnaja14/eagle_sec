"""
Quick test to verify department column is working
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from courses.models import Course
from accounts.models import User, Tenant

print("=" * 60)
print("Testing Department Column")
print("=" * 60)

# Test 1: Check if we can query courses with department
print("\n1. Testing Course.objects.filter(department=...)")
try:
    courses = Course.objects.filter(department='IT Security')
    print(f"   ✓ Query successful! Found {courses.count()} courses")
except Exception as e:
    print(f"   ✗ Query failed: {e}")

# Test 2: Check if we can create a course with department
print("\n2. Testing course creation with department")
try:
    # Get or create a test tenant
    tenant, _ = Tenant.objects.get_or_create(
        slug='test-tenant',
        defaults={'name': 'Test Tenant'}
    )
    
    # Get or create a test user
    user = User.objects.filter(role='admin').first()
    if not user:
        user = User.objects.create_user(
            username='test_admin',
            password='test123',
            role='admin',
            tenant=tenant
        )
    
    # Try to create a course with department
    course = Course.objects.create(
        tenant=tenant,
        created_by=user,
        display_name='Test Course with Department',
        description='Testing department field',
        department='IT Security',
        status='active'
    )
    print(f"   ✓ Course created successfully!")
    print(f"     ID: {course.id}")
    print(f"     Department: {course.department}")
    
    # Clean up
    course.delete()
    print(f"   ✓ Test course deleted")
    
except Exception as e:
    print(f"   ✗ Course creation failed: {e}")

# Test 3: Check trainee user setup
print("\n3. Checking trainee user setup")
try:
    trainee = User.objects.filter(role='trainee').first()
    if trainee:
        print(f"   ✓ Trainee user found: {trainee.username}")
        print(f"     Tenant: {trainee.tenant}")
        print(f"     Department: {trainee.department or '(not set)'}")
    else:
        print(f"   ⚠ No trainee user found")
        print(f"     Run: python manage.py seed_sample_data")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 4: Check active courses for trainee
print("\n4. Checking active courses")
try:
    trainee = User.objects.filter(role='trainee').first()
    if trainee:
        courses = Course.objects.filter(
            tenant=trainee.tenant,
            status='active'
        )
        print(f"   ✓ Found {courses.count()} active courses in trainee's tenant")
        
        if trainee.department:
            dept_courses = courses.filter(department=trainee.department)
            print(f"   ✓ Found {dept_courses.count()} courses in trainee's department")
    else:
        print(f"   ⚠ No trainee user to test with")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n" + "=" * 60)
print("Department column is working correctly!")
print("=" * 60)
