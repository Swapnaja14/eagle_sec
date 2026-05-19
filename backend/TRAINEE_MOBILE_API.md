# Trainee Mobile App API Documentation

## Get Trainee Courses with Videos and Documents

### Endpoint
```
GET /api/courses/trainee/my-courses/
```

### Description
Fetches all active courses matching the trainee's company (tenant) and department. Courses are filtered to show only those created by trainers in the same company and department. Includes all videos and documents (PDFs) for each course. This endpoint is specifically designed for the trainee mobile app.

### Authentication
- **Required**: Yes (JWT Bearer Token)
- **Role**: Trainee only

### Filtering Logic
1. **Company Match**: Courses must belong to the same tenant (company) as the trainee
2. **Department Match**: Courses must be created by trainers in the same department as the trainee
3. **Status**: Only active courses are returned (draft and retired courses are excluded)

### Request Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Response Format

#### Success Response (200 OK)
```json
{
  "trainee": {
    "id": 1,
    "username": "trainee",
    "full_name": "John Doe",
    "email": "trainee@example.com",
    "department": "IT Security",
    "company": "Demo Organization"
  },
  "courses": [
    {
      "id": 1,
      "course_id": "CS-1-ABC123",
      "title": "Cybersecurity Fundamentals",
      "description": "Learn the basics of cybersecurity...",
      "start_date": "2026-01-01",
      "end_date": "2026-12-31",
      "compliance_taxonomy": "ISO 27001",
      "skills_taxonomy": "Threat Analysis",
      "trainer": {
        "id": 2,
        "name": "Jane Smith",
        "email": "trainer@example.com",
        "department": "IT Security"
      },
      "lessons": [
        {
          "id": 1,
          "title": "Introduction to Cybersecurity",
          "order": 1,
          "files": [
            {
              "id": 1,
              "filename": "intro_video.mp4",
              "file_url": "http://localhost:8000/media/lesson_files/2026/05/intro_video.mp4",
              "file_type": "video",
              "language": "en",
              "allow_offline_download": true,
              "uploaded_at": "2026-05-19T10:30:00Z"
            },
            {
              "id": 2,
              "filename": "course_materials.pdf",
              "file_url": "http://localhost:8000/media/lesson_files/2026/05/course_materials.pdf",
              "file_type": "pdf",
              "language": "en",
              "allow_offline_download": true,
              "uploaded_at": "2026-05-19T10:35:00Z"
            }
          ],
          "videos": [
            {
              "id": 1,
              "filename": "intro_video.mp4",
              "file_url": "http://localhost:8000/media/lesson_files/2026/05/intro_video.mp4",
              "file_type": "video",
              "language": "en",
              "allow_offline_download": true,
              "uploaded_at": "2026-05-19T10:30:00Z"
            }
          ],
          "documents": [
            {
              "id": 2,
              "filename": "course_materials.pdf",
              "file_url": "http://localhost:8000/media/lesson_files/2026/05/course_materials.pdf",
              "file_type": "pdf",
              "language": "en",
              "allow_offline_download": true,
              "uploaded_at": "2026-05-19T10:35:00Z"
            }
          ],
          "video_count": 1,
          "document_count": 1
        }
      ],
      "lesson_count": 1,
      "total_videos": 1,
      "total_documents": 1,
      "has_pre_assessment": true,
      "has_post_assessment": true,
      "has_certification": true,
      "assignment_status": "assigned",
      "due_date": "2026-06-30",
      "assigned_at": "2026-05-19T09:00:00Z"
    }
  ],
  "total_courses": 1
}
```

#### Error Responses

**403 Forbidden** - User is not a trainee
```json
{
  "detail": "This endpoint is only accessible to trainees."
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Field Descriptions

#### Trainee Object
- `id`: Unique trainee ID
- `username`: Trainee's username
- `full_name`: Trainee's full name
- `email`: Trainee's email address
- `department`: Trainee's department
- `company`: Company/organization name (tenant)

#### Course Object
- `id`: Unique course ID
- `course_id`: Human-readable course identifier
- `title`: Course display name
- `description`: Course description
- `start_date`: Course start date (nullable)
- `end_date`: Course end date (nullable)
- `compliance_taxonomy`: Compliance standard (ISO 27001, SOC2, GDPR, etc.)
- `skills_taxonomy`: Skill category (Threat Analysis, Incident Response, etc.)
- `trainer`: Trainer/instructor information object (who created the course)
- `lessons`: Array of lesson objects
- `lesson_count`: Total number of lessons
- `total_videos`: Total video files across all lessons
- `total_documents`: Total document files (PDFs, docs, presentations) across all lessons
- `has_pre_assessment`: Whether course has an active pre-assessment
- `has_post_assessment`: Whether course has an active post-assessment
- `has_certification`: Whether course offers certification
- `assignment_status`: Training assignment status (assigned, in_progress, completed, overdue, null if not assigned)
- `due_date`: Assignment due date (nullable)
- `assigned_at`: When the course was assigned (nullable)

#### Trainer Object
- `id`: Unique trainer ID
- `name`: Trainer's full name
- `email`: Trainer's email address
- `department`: Trainer's department

#### Lesson Object
- `id`: Unique lesson ID
- `title`: Lesson title
- `order`: Lesson order/sequence number
- `files`: Array of all file objects (videos and documents combined)
- `videos`: Array of video file objects only
- `documents`: Array of document file objects only (PDFs, docs, presentations)
- `video_count`: Number of video files in this lesson
- `document_count`: Number of document files in this lesson

#### File Object
- `id`: Unique file ID
- `filename`: Original filename
- `file_url`: Full URL to download/stream the file
- `file_type`: Type of file (video, document, pdf, presentation)
- `language`: File language code (en, hi, fr, etc.)
- `allow_offline_download`: Whether file can be downloaded for offline viewing
- `uploaded_at`: When the file was uploaded

### File Types
- `video`: Video files (.mp4, .mov, .avi, .mkv, .webm)
- `document`: Document files (.doc, .docx)
- `pdf`: PDF files (.pdf)
- `presentation`: Presentation files (.ppt, .pptx)

### Assignment Status Values
- `assigned`: Course has been assigned but not started
- `in_progress`: Trainee has started the course
- `completed`: Trainee has completed the course
- `overdue`: Course is past due date
- `null`: Course is available but not specifically assigned

### Usage Example

#### Using cURL
```bash
curl -X GET "http://localhost:8000/api/courses/trainee/my-courses/" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "Content-Type: application/json"
```

#### Using JavaScript (Fetch API)
```javascript
const response = await fetch('http://localhost:8000/api/courses/trainee/my-courses/', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Courses:', data.courses);
```

#### Using Python (Requests)
```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'http://localhost:8000/api/courses/trainee/my-courses/',
    headers=headers
)

data = response.json()
print(f"Total courses: {data['total_courses']}")
```

### Notes

1. **Company Matching**: Courses are automatically filtered by the trainee's company (tenant). Only courses belonging to the same tenant are returned.

2. **Department Filtering**: Courses are filtered to show only those created by trainers in the same department as the trainee. This ensures trainees see relevant courses for their department.

3. **Trainer Information**: Each course includes information about the trainer who created it, including their name, email, and department.

4. **Separate Video and Document Arrays**: Each lesson provides three arrays:
   - `files`: All files combined
   - `videos`: Only video files
   - `documents`: Only document files (PDFs, docs, presentations)
   This makes it easier to display videos and documents separately in the mobile app.

5. **Active Courses Only**: Only courses with status='active' are returned. Draft and retired courses are excluded.

6. **File URLs**: File URLs are absolute URLs that can be used directly in the mobile app for streaming or downloading.

7. **Offline Downloads**: Check the `allow_offline_download` flag before enabling download functionality in the mobile app.

8. **Video Streaming**: Video files can be streamed directly using the `file_url`. Consider implementing adaptive streaming for better mobile experience.

9. **Authentication**: The JWT token must be valid and belong to a user with role='trainee'.

10. **Empty Department**: If the trainee has no department assigned, all courses in their company will be returned (no department filtering).

### Mobile App Implementation Tips

1. **Caching**: Cache course data locally to improve performance and enable offline access
2. **Progressive Loading**: Load course list first, then fetch lesson details on demand
3. **Download Management**: Implement a download queue for offline content
4. **Progress Tracking**: Track video playback progress and document reading status
5. **Sync Status**: Periodically sync assignment status with the server
6. **Error Handling**: Handle network errors gracefully with retry logic
