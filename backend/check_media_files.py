"""
Check and fix media file paths
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from courses.models import LessonFile
from django.conf import settings

print("=" * 70)
print("Checking Media Files Configuration")
print("=" * 70)

# Check settings
print(f"\n1. Django Settings:")
print(f"   MEDIA_URL: {settings.MEDIA_URL}")
print(f"   MEDIA_ROOT: {settings.MEDIA_ROOT}")
print(f"   DEBUG: {settings.DEBUG}")

# Check if media directory exists
media_exists = os.path.exists(settings.MEDIA_ROOT)
print(f"\n2. Media Directory:")
print(f"   Path: {settings.MEDIA_ROOT}")
print(f"   Exists: {'✓ Yes' if media_exists else '✗ No'}")

if not media_exists:
    print(f"   Creating media directory...")
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    print(f"   ✓ Created")

# Check lesson files
print(f"\n3. Lesson Files in Database:")
lesson_files = LessonFile.objects.all()
print(f"   Total files: {lesson_files.count()}")

if lesson_files.exists():
    print(f"\n   File Details:")
    for lf in lesson_files[:10]:  # Show first 10
        file_path = lf.file.name if lf.file else 'No file'
        full_path = os.path.join(settings.MEDIA_ROOT, file_path) if lf.file else None
        exists = os.path.exists(full_path) if full_path else False
        
        print(f"\n   - ID: {lf.id}")
        print(f"     Filename: {lf.original_filename}")
        print(f"     Type: {lf.file_type}")
        print(f"     DB Path: {file_path}")
        print(f"     Full Path: {full_path}")
        print(f"     Exists: {'✓ Yes' if exists else '✗ No'}")
        
        if lf.file:
            print(f"     URL: {settings.MEDIA_URL}{file_path}")

# Check lesson_files directory structure
lesson_files_dir = os.path.join(settings.MEDIA_ROOT, 'lesson_files')
print(f"\n4. Lesson Files Directory:")
print(f"   Path: {lesson_files_dir}")
print(f"   Exists: {'✓ Yes' if os.path.exists(lesson_files_dir) else '✗ No'}")

if not os.path.exists(lesson_files_dir):
    print(f"   Creating lesson_files directory...")
    os.makedirs(lesson_files_dir, exist_ok=True)
    print(f"   ✓ Created")

# Create year/month subdirectories
from datetime import datetime
current_year = datetime.now().year
current_month = datetime.now().strftime('%m')

year_dir = os.path.join(lesson_files_dir, str(current_year))
month_dir = os.path.join(year_dir, current_month)

print(f"\n5. Creating Directory Structure:")
for directory in [year_dir, month_dir]:
    if not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
        print(f"   ✓ Created: {directory}")
    else:
        print(f"   ✓ Exists: {directory}")

print("\n" + "=" * 70)
print("Media Configuration Check Complete")
print("=" * 70)

# Provide instructions
print("\n📝 Next Steps:")
print("   1. Upload files through Django admin or API")
print("   2. Files will be stored in: backend/media/lesson_files/YYYY/MM/")
print("   3. Access files via: http://localhost:8000/media/lesson_files/...")
print("   4. Make sure Django server is running in DEBUG mode")
