# File Upload Guide - Videos and Documents

## Overview

This guide explains how to upload video and document files to your courses so they can be accessed by the trainee mobile app.

## Current Status

✅ Media serving configured
✅ Directories created
✅ Placeholder files created (for testing)
⚠️ Need to upload real files

## Method 1: Upload via Django Admin (Easiest)

### Step 1: Start Django Server

```bash
cd backend
python manage.py runserver
```

### Step 2: Access Django Admin

Open browser: `http://localhost:8000/admin/`

Login with your admin credentials.

### Step 3: Navigate to Lesson Files

1. Click on **"Courses"** in the left sidebar
2. Click on **"Lesson files"**
3. You'll see a list of all lesson files

### Step 4: Upload Files

For each file:

1. Click on the file name (e.g., "AT.pdf")
2. In the **"File"** field, click **"Choose File"**
3. Select your video or document from your computer
4. Click **"Save"**

The file will be uploaded to: `backend/media/lesson_files/YYYY/MM/filename.ext`

### Step 5: Verify Upload

After uploading, test the file URL in browser:
```
http://localhost:8000/media/lesson_files/2026/05/your-file.mp4
```

## Method 2: Upload via API

### Step 1: Get Authentication Token

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Copy the `access` token from the response.

### Step 2: Upload File

```bash
curl -X POST http://localhost:8000/api/courses/1/lessons/1/files/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/your/video.mp4" \
  -F "language=en" \
  -F "allow_offline_download=true"
```

Replace:
- `YOUR_ACCESS_TOKEN` with your token
- `/path/to/your/video.mp4` with your file path
- `1` (first) with your course ID
- `1` (second) with your lesson ID

### Step 3: Verify Upload

The API will return the file details including the URL.

## Method 3: Direct File Copy (For Bulk Upload)

### Step 1: Prepare Your Files

Organize your files with the same names as in the database:

```
your-files/
├── Course_Attendance_Management_System_-_Google_Chrome_2026-04-27_09-49-43.mp4
├── AT.pdf
├── certificate_1_1777968282.pdf
├── video-997921546747559.mp4
├── a-highly-cinematic-indian-college-scene-showing-a-.mp4
├── 15374243_1920_1080_30fps.mp4
└── SEAPM_QUESTION_BANK.pdf
```

### Step 2: Copy Files

Copy all files to:
```
backend/media/lesson_files/2026/05/
```

On Windows:
```powershell
Copy-Item "C:\your-files\*" "D:\Collage\SEMESTER IV\Final Project\eagle_sec\backend\media\lesson_files\2026\05\"
```

On Linux/Mac:
```bash
cp /path/to/your-files/* backend/media/lesson_files/2026/05/
```

### Step 3: Verify Files

```bash
python check_media_files.py
```

All files should show "Exists: ✓ Yes"

## File Requirements

### Video Files

**Supported Formats:**
- MP4 (recommended)
- MOV
- AVI
- WebM

**Recommendations:**
- Resolution: 720p or 1080p
- Codec: H.264
- Max size: 500MB per file
- Frame rate: 30fps

### Document Files

**Supported Formats:**
- PDF (recommended)
- DOCX
- PPTX
- TXT

**Recommendations:**
- PDF version: 1.4 or higher
- Max size: 50MB per file
- Optimize PDFs before upload

## Testing File Access

### Test in Browser

1. Start Django server:
   ```bash
   python manage.py runserver
   ```

2. Open browser and navigate to:
   ```
   http://localhost:8000/media/lesson_files/2026/05/your-file.mp4
   ```

3. Video should play or document should download

### Test via API

```bash
# Get trainee courses (includes file URLs)
curl -X GET http://localhost:8000/api/courses/trainee-courses/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response will include file URLs:
```json
{
  "files": [
    {
      "id": 1,
      "original_filename": "video.mp4",
      "file": "/media/lesson_files/2026/05/video.mp4",
      "file_type": "video"
    }
  ]
}
```

## Mobile App Integration

### Video Player

```javascript
import Video from 'react-native-video';

const VideoPlayer = ({ fileUrl }) => {
  const fullUrl = `http://your-server.com${fileUrl}`;
  
  return (
    <Video
      source={{ uri: fullUrl }}
      style={{ width: '100%', height: 300 }}
      controls={true}
      resizeMode="contain"
    />
  );
};
```

### Document Viewer

```javascript
import { WebView } from 'react-native-webview';

const DocumentViewer = ({ fileUrl }) => {
  const fullUrl = `http://your-server.com${fileUrl}`;
  
  return (
    <WebView
      source={{ uri: fullUrl }}
      style={{ flex: 1 }}
    />
  );
};
```

### Download for Offline

```javascript
import RNFS from 'react-native-fs';

const downloadFile = async (fileUrl, filename) => {
  const fullUrl = `http://your-server.com${fileUrl}`;
  const downloadDest = `${RNFS.DocumentDirectoryPath}/${filename}`;
  
  const download = RNFS.downloadFile({
    fromUrl: fullUrl,
    toFile: downloadDest,
  });
  
  const result = await download.promise;
  
  if (result.statusCode === 200) {
    console.log('Downloaded to:', downloadDest);
    return downloadDest;
  }
};
```

## Troubleshooting

### Issue: 404 Not Found

**Cause:** File doesn't exist on disk

**Solution:**
1. Check if file exists:
   ```bash
   python check_media_files.py
   ```
2. Upload the file via admin or API

### Issue: Permission Denied

**Cause:** File permissions incorrect

**Solution (Linux/Mac):**
```bash
chmod 644 backend/media/lesson_files/2026/05/*
```

### Issue: Video Won't Play

**Cause:** Unsupported format or codec

**Solution:**
1. Convert to MP4 with H.264 codec
2. Use tools like FFmpeg:
   ```bash
   ffmpeg -i input.mov -c:v libx264 -c:a aac output.mp4
   ```

### Issue: File Too Large

**Cause:** Django has upload size limits

**Solution:**
Update `settings.py`:
```python
# Maximum upload size (in bytes)
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB
```

## Production Deployment

For production, use cloud storage:

### AWS S3 Setup

1. Install dependencies:
   ```bash
   pip install django-storages boto3
   ```

2. Configure settings:
   ```python
   # settings.py
   INSTALLED_APPS += ['storages']
   
   DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
   AWS_ACCESS_KEY_ID = 'your-key'
   AWS_SECRET_ACCESS_KEY = 'your-secret'
   AWS_STORAGE_BUCKET_NAME = 'your-bucket'
   AWS_S3_REGION_NAME = 'us-east-1'
   AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
   ```

3. Files will automatically upload to S3

## Quick Commands

```bash
# Check media configuration
python check_media_files.py

# Create placeholder files (testing)
python create_placeholder_files.py

# Start Django server
python manage.py runserver

# Access Django admin
# http://localhost:8000/admin/courses/lessonfile/

# Test file URL
# http://localhost:8000/media/lesson_files/2026/05/filename.mp4
```

## Summary

1. ✅ Media serving is configured
2. ✅ Directories are created
3. ✅ Placeholder files exist (for testing)
4. ⚠️ Upload real files via:
   - Django Admin (easiest)
   - API (programmatic)
   - Direct copy (bulk upload)
5. ✅ Test file access in browser
6. ✅ Integrate with mobile app

Your media serving infrastructure is ready. Just upload the actual video and document files!
