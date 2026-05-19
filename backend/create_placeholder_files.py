"""
Create placeholder files for testing media serving
This creates empty files so you can test the media serving functionality
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from courses.models import LessonFile
from django.conf import settings

print("=" * 70)
print("Creating Placeholder Files for Testing")
print("=" * 70)

lesson_files = LessonFile.objects.all()
created_count = 0
skipped_count = 0

for lf in lesson_files:
    if lf.file:
        full_path = os.path.join(settings.MEDIA_ROOT, lf.file.name)
        
        # Check if file already exists
        if os.path.exists(full_path):
            print(f"\n✓ Exists: {lf.original_filename}")
            skipped_count += 1
            continue
        
        # Create directory if it doesn't exist
        directory = os.path.dirname(full_path)
        os.makedirs(directory, exist_ok=True)
        
        # Create placeholder file
        try:
            with open(full_path, 'wb') as f:
                if lf.file_type == 'video':
                    # Write a small placeholder for video
                    f.write(b'PLACEHOLDER VIDEO FILE - Replace with actual video\n')
                    f.write(b'This is a test file created for development.\n')
                    f.write(b'Upload the real video file to replace this.\n')
                elif lf.file_type in ['document', 'pdf']:
                    # Write a small placeholder for document
                    f.write(b'%PDF-1.4\n')
                    f.write(b'PLACEHOLDER PDF FILE - Replace with actual document\n')
                else:
                    # Generic placeholder
                    f.write(b'PLACEHOLDER FILE - Replace with actual file\n')
            
            print(f"\n✓ Created: {lf.original_filename}")
            print(f"  Path: {full_path}")
            print(f"  Type: {lf.file_type}")
            print(f"  URL: {settings.MEDIA_URL}{lf.file.name}")
            created_count += 1
            
        except Exception as e:
            print(f"\n✗ Error creating {lf.original_filename}: {e}")

print("\n" + "=" * 70)
print(f"Summary:")
print(f"  Created: {created_count} files")
print(f"  Skipped: {skipped_count} files (already exist)")
print(f"  Total: {lesson_files.count()} files in database")
print("=" * 70)

print("\n📝 Next Steps:")
print("   1. Start Django server: python manage.py runserver")
print("   2. Test file access: http://localhost:8000/media/lesson_files/...")
print("   3. Replace placeholders with real files via Django admin")
print("   4. Or upload new files via API")

print("\n⚠️  Note: These are PLACEHOLDER files for testing only!")
print("   Replace them with actual video/document files for production use.")
