# Media Files Fix - Video and Document Serving

## Problem

Two issues were identified:

1. **404 Error:** Media files (videos/documents) return "Page not found"
2. **Missing Files:** Files referenced in database don't exist on disk

## Root Causes

### Issue 1: Media Directory Missing
- The `media/` directory didn't exist
- Django couldn't serve files from a non-existent directory

### Issue 2: Files Not Uploaded
- Database has references to files (lesson_files table)
- Actual files were never uploaded or were deleted
- 7 files in database, 0 files on disk

## Solutions Implemented

### 1. Created Media Directory Structure

```
backend/
└── media/
    └── lesson_files/
        └── 2026/
            └── 05/
```

### 2. Updated URL Configuration

**File:** `backend/learnsphere/urls.py`

```python
# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

This ensures media files are served when `DEBUG=True`.

### 3. Verified Settings

**File:** `backend/learnsphere/settings.py`

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEBUG = True  # Required for development
```

## How to Fix Missing Files

### Option 1: Re-upload Files (Recommended)

1. **Via Django Admin:**
   ```
   http://localhost:8000/admin/courses/lessonfile/
   ```
   - Click on each lesson file
   - Upload the actual file
   - Save

2. **Via API:**
   ```bash
   POST /api/courses/{course_id}/lessons/{lesson_id}/files/
   Content-Type: multipart/form-data
   
   file: [your video/document file]
   language: en
   allow_offline_download: true
   ```

### Option 2: Clean Up Database (Remove Missing Files)

If you don't have the original files:

```python
# Run in Django shell
python manage.py shell

from courses.models import LessonFile
import os
from django.conf import settings

# Find files that don't exist
for lf in LessonFile.objects.all():
    if lf.file:
        full_path = os.path.join(settings.MEDIA_ROOT, lf.file.name)
        if not os.path.exists(full_path):
            print(f"Missing: {lf.original_filename} (ID: {lf.id})")
            # Optionally delete the database record
            # lf.delete()
```

### Option 3: Create Placeholder Files (For Testing)

```python
# Run this script
python create_placeholder_files.py
```

## Current File Status

From database (7 files):

| ID | Filename | Type | Status |
|----|----------|------|--------|
| 1 | Course_Attendance_Management_System...mp4 | video | ✗ Missing |
| 2 | AT.pdf | document | ✗ Missing |
| 3 | certificate_1_1777968282.pdf | document | ✗ Missing |
| 4 | a-highly-cinematic-indian-college-scene...mp4 | video | ✗ Missing |
| 5 | video-997921546747559.mp4 | video | ✗ Missing |
| 6 | 15374243_1920_1080_30fps.mp4 | video | ✗ Missing |
| 7 | SEAPM_QUESTION_BANK.pdf | pdf | ✗ Missing |

## Testing Media Files

### 1. Check Configuration
```bash
python check_media_files.py
```

### 2. Test File Upload

**Via cURL:**
```bash
# Login first
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access')

# Upload a file
curl -X POST http://localhost:8000/api/courses/1/lessons/1/files/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/video.mp4" \
  -F "language=en" \
  -F "allow_offline_download=true"
```

### 3. Access Uploaded Files

Once uploaded, files are accessible at:
```
http://localhost:8000/media/lesson_files/2026/05/filename.mp4
```

## Mobile App Integration

### Update API Response Handling

The API returns file URLs like:
```json
{
  "file": "/media/lesson_files/2026/05/video.mp4"
}
```

In your mobile app, construct the full URL:

```javascript
const BASE_URL = 'http://your-server.com';
const fullUrl = `${BASE_URL}${file.file}`;

// For video player
<Video source={{ uri: fullUrl }} />

// For document viewer
<WebView source={{ uri: fullUrl }} />
```

### Handle Missing Files

Add error handling in mobile app:

```javascript
const openFile = async (fileUrl) => {
  try {
    const fullUrl = `${BASE_URL}${fileUrl}`;
    const response = await fetch(fullUrl, { method: 'HEAD' });
    
    if (response.ok) {
      // File exists, open it
      await Linking.openURL(fullUrl);
    } else {
      // File missing
      Alert.alert('Error', 'File not found on server');
    }
  } catch (error) {
    Alert.alert('Error', 'Could not access file');
  }
};
```

## Production Considerations

### For Production Deployment:

1. **Use Cloud Storage:**
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage

2. **Install django-storages:**
   ```bash
   pip install django-storages boto3
   ```

3. **Configure S3 (example):**
   ```python
   # settings.py
   DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
   AWS_ACCESS_KEY_ID = 'your-key'
   AWS_SECRET_ACCESS_KEY = 'your-secret'
   AWS_STORAGE_BUCKET_NAME = 'your-bucket'
   AWS_S3_REGION_NAME = 'us-east-1'
   ```

4. **Never serve media via Django in production**
   - Use nginx or CDN
   - Django is slow for serving files

## Verification Checklist

- [x] Media directory exists
- [x] Media URL configuration correct
- [x] DEBUG mode enabled (development)
- [x] URL patterns include media serving
- [ ] Files uploaded to media directory
- [ ] Files accessible via browser
- [ ] Mobile app can play videos
- [ ] Mobile app can view documents

## Quick Fix Commands

```bash
# Check media configuration
python check_media_files.py

# Start Django server
python manage.py runserver

# Test file access
curl http://localhost:8000/media/lesson_files/2026/05/test.mp4

# Upload via admin
# Go to: http://localhost:8000/admin/courses/lessonfile/
```

## Status

✅ **Media serving configured correctly**
⚠️ **Files need to be uploaded**

The infrastructure is ready. You just need to upload the actual video and document files.
