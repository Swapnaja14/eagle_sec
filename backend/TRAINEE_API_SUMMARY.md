# Trainee Mobile App API - Quick Summary

## Endpoint
```
GET /api/courses/trainee/my-courses/
```

## What It Does
Fetches all courses for a trainee that match:
1. ✅ **Same Company (Tenant)** - Only courses from trainee's organization
2. ✅ **Same Department** - Only courses created by trainers in trainee's department
3. ✅ **Active Status** - Only active courses (excludes draft/retired)

## What You Get

### Course Information
- Course details (title, description, dates)
- Trainer information (name, email, department)
- Assignment status (assigned, in_progress, completed, overdue)
- Compliance and skills taxonomy

### Videos & Documents
Each lesson includes:
- **Separate arrays** for videos and documents
- **Full URLs** for streaming/downloading
- **Offline download** flags
- **File metadata** (filename, type, language, upload date)

### Counts & Statistics
- Total courses
- Lessons per course
- Total videos per course
- Total documents per course
- Video/document count per lesson

## Response Structure
```json
{
  "trainee": {
    "id": 1,
    "username": "trainee",
    "full_name": "John Doe",
    "department": "IT Security",
    "company": "Demo Organization"
  },
  "courses": [
    {
      "id": 1,
      "title": "Course Name",
      "trainer": {
        "name": "Trainer Name",
        "department": "IT Security"
      },
      "lessons": [
        {
          "title": "Lesson 1",
          "videos": [...],      // Array of video files
          "documents": [...],   // Array of PDF/doc files
          "video_count": 2,
          "document_count": 3
        }
      ],
      "total_videos": 5,
      "total_documents": 8,
      "assignment_status": "assigned"
    }
  ],
  "total_courses": 10
}
```

## Key Features

### 1. Department Filtering
- Automatically filters courses by trainer's department
- Ensures trainees see relevant courses for their role
- If trainee has no department, shows all company courses

### 2. Trainer Information
- Shows who created each course
- Includes trainer's department for context
- Helps trainees know who to contact

### 3. Separate Video/Document Arrays
- `videos[]` - Only video files
- `documents[]` - Only PDFs, docs, presentations
- `files[]` - All files combined
- Makes UI implementation easier

### 4. Assignment Tracking
- Shows if course is assigned to trainee
- Displays due dates
- Tracks completion status

## Authentication
- **Required**: JWT Bearer Token
- **Role**: Trainee only
- **Header**: `Authorization: Bearer <token>`

## Testing
Run the test script:
```bash
cd backend
python test_trainee_api.py
```

## Mobile App Implementation Tips

### 1. Display Videos Separately
```javascript
// Show videos in a video player section
lesson.videos.forEach(video => {
  renderVideoPlayer(video.file_url, video.filename);
});
```

### 2. Display Documents Separately
```javascript
// Show documents in a documents list
lesson.documents.forEach(doc => {
  renderDocumentLink(doc.file_url, doc.filename);
});
```

### 3. Check Offline Download
```javascript
if (file.allow_offline_download) {
  showDownloadButton(file);
}
```

### 4. Filter by Department
The API automatically filters by department, so you don't need to do anything special. Just call the endpoint and you'll get the right courses.

### 5. Show Trainer Info
```javascript
// Display trainer information
<Text>Instructor: {course.trainer.name}</Text>
<Text>Department: {course.trainer.department}</Text>
```

## Error Handling

### 403 Forbidden
User is not a trainee - check user role

### 401 Unauthorized
Token is missing or invalid - re-authenticate

### 200 with Empty Courses
- No courses match trainee's department
- No active courses available
- Trainee not assigned to any courses

## Performance Tips
1. Cache course list locally
2. Load videos on-demand (don't preload all)
3. Implement pagination if needed
4. Use lazy loading for lesson content
5. Download documents in background

## Next Steps
1. Test the endpoint with your trainee credentials
2. Integrate into mobile app
3. Implement video player
4. Add document viewer
5. Enable offline downloads
6. Track progress/completion
