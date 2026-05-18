# Trainee Mobile App Features

## Overview
This mobile app provides trainee-side functionality to fetch and render courses, lessons, study materials, assignments, and certificates from the Django backend.

## ✅ Implemented Features

### 1. **Lessons & Study Materials** (`LessonsScreen.js`)
- Fetches lessons for a specific course from `/api/courses/{id}/lessons/`
- Displays lessons in order with lesson number badges
- Shows all study materials (PDFs, videos, documents, images) for each lesson
- Material cards with file type icons and metadata
- Open/download materials via device browser
- Pull-to-refresh support
- Loading states and error handling
- Empty state when no lessons available
- Safe rendering with optional chaining

**API Endpoint:** `GET /api/courses/{courseId}/lessons/`

**Response Structure:**
```json
[
  {
    "id": 1,
    "title": "Introduction to Security",
    "order": 1,
    "files": [
      {
        "id": 1,
        "file": "/media/lesson_files/2024/01/intro.pdf",
        "original_filename": "intro.pdf",
        "file_type": "pdf",
        "language": "en"
      }
    ]
  }
]
```

### 2. **Assignments** (`AssignmentsScreen.js`)
- Fetches trainee's assignments from `/api/assignments/mine/`
- Displays assignment cards with:
  - Course name
  - Due date
  - Assigned date
  - Status badge (Assigned, In Progress, Completed, Overdue)
  - Notes from trainer
- Filter tabs: All, Pending, Completed
- Mark assignment as complete
- Navigate to course details
- Pull-to-refresh support
- Loading states and error handling
- Empty state for each filter
- Safe rendering with fallback arrays

**API Endpoint:** `GET /api/assignments/mine/`

**Response Structure:**
```json
[
  {
    "id": 1,
    "trainee": 5,
    "trainee_username": "john_doe",
    "trainee_name": "John Doe",
    "course": 1,
    "course_title": "Cybersecurity Fundamentals",
    "assigned_at": "2024-01-15T10:00:00Z",
    "due_date": "2024-02-15",
    "status": "assigned",
    "notes": "Complete by end of month"
  }
]
```

**Complete Assignment:** `POST /api/assignments/{id}/complete/`

### 3. **Certificates** (`CertificatesScreen.js`)
- Fetches trainee's earned certificates from `/api/certificates/employee/{userId}/`
- Displays certificate cards with:
  - Course name
  - Issue date
  - Recipient name
  - Award icon
- Download certificate PDF
- Open certificate in browser
- Pull-to-refresh support
- Loading states and error handling
- Empty state with motivational message
- Footer showing total certificates earned
- Safe rendering with optional chaining

**API Endpoint:** `GET /api/certificates/employee/{userId}/`

**Response Structure:**
```json
[
  {
    "id": 1,
    "employee": {
      "id": 5,
      "username": "john_doe",
      "first_name": "John",
      "last_name": "Doe"
    },
    "course": {
      "id": 1,
      "display_name": "Cybersecurity Fundamentals"
    },
    "issued_at": "2024-01-20T14:30:00Z",
    "download_url": "http://localhost:8000/api/certificates/1/download/"
  }
]
```

**Download Certificate:** `GET /api/certificates/{id}/download/`

### 4. **Course Details** (`CourseDetailScreen.js`)
- Enhanced with "View Lessons & Materials" button
- Navigates to LessonsScreen
- Shows lesson count
- Maintains existing assessment functionality

### 5. **Dashboard** (`DashboardScreen.js`)
- Added "My Assignments" quick action
- Shows pending assignment count
- Added "My Certificates" quick action
- Integrated with useAssignments hook
- Shows real-time assignment statistics

## 🔧 API Integration

### API Files Updated

#### `mobile/src/api/courses.api.js`
- `getCourses()` - Fetch all courses with safe normalization
- `getCourseDetail(courseId)` - Fetch course with lessons and materials
- `getCourseLessons(courseId)` - Fetch lessons with study materials
- `getCourseStats(courseId)` - Fetch course statistics

#### `mobile/src/api/assignments.api.js`
- `getMyAssignments()` - Fetch trainee's assignments
- `getAssignmentDetail(assignmentId)` - Fetch single assignment
- `completeAssignment(assignmentId)` - Mark assignment complete

#### `mobile/src/api/certificates.api.js`
- `getMyCertificates(userId)` - Fetch trainee's certificates
- `getCertificateUrl(certificateId)` - Get download URL
- `downloadCertificate(certificateId)` - Download PDF

### Defensive Programming Features

✅ **Optional Chaining** - All data access uses `?.` operator
✅ **Fallback Arrays** - `Array.isArray(data) ? data : []`
✅ **Null Checks** - Validates data before rendering
✅ **Error Boundaries** - Try-catch blocks in all API calls
✅ **Loading States** - ActivityIndicator during data fetch
✅ **Empty States** - User-friendly messages when no data
✅ **Retry Buttons** - Allow users to retry failed requests
✅ **Pull-to-Refresh** - RefreshControl on all list screens
✅ **Safe Normalization** - Handles different response formats

### Response Normalization

All API responses are normalized to handle:
- Direct arrays: `[...]`
- Paginated responses: `{ results: [...] }`
- Single objects: `{ ... }`
- Null/undefined responses
- Empty responses

```javascript
const normalizeResponse = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.results)) return response.results;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (typeof response === 'object' && response) return [response];
  return [];
};
```

## 🎨 UI/UX Features

### Design System
- Consistent yellow theme (`colors.primary`)
- Card-based layouts with shadows
- Rounded corners and pill buttons
- Icon-based navigation
- Status badges with color coding
- Responsive spacing

### User Experience
- Smooth navigation transitions
- Instant feedback on actions
- Clear error messages
- Loading indicators
- Empty state illustrations
- Pull-to-refresh gestures
- Safe back navigation

## 🔐 Authentication

All API calls include JWT authentication:
```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

Token refresh is handled automatically by the API client.

## 📱 Navigation Structure

```
AppNavigator
├── Main (TabNavigator)
│   ├── Dashboard
│   ├── Courses (Catalog)
│   └── Profile
├── CourseDetail
├── Lessons ← NEW
├── Assignments ← NEW
└── Certificates ← NEW
```

## 🚀 Usage Examples

### Navigate to Lessons
```javascript
navigation.navigate('Lessons', {
  courseId: 1,
  courseName: 'Cybersecurity Fundamentals'
});
```

### Navigate to Assignments
```javascript
navigation.navigate('Assignments');
```

### Navigate to Certificates
```javascript
navigation.navigate('Certificates');
```

## 🛡️ Error Handling

### Network Errors
- Displays user-friendly error messages
- Provides retry buttons
- Falls back to cached data when available

### Empty Data
- Shows appropriate empty state UI
- Provides guidance on next steps
- Maintains app stability

### Invalid Data
- Validates all data before rendering
- Uses fallback values for missing fields
- Prevents crashes from undefined data

## 📊 Data Flow

```
Backend (Django)
    ↓
API Endpoints
    ↓
API Client (with JWT)
    ↓
API Functions (courses.api.js, assignments.api.js, certificates.api.js)
    ↓
Hooks (useAssignments.js)
    ↓
Screens (LessonsScreen, AssignmentsScreen, CertificatesScreen)
    ↓
UI Components
```

## ✨ Key Features

1. **No Mock Data** - All data fetched from real backend
2. **No Trainer Logic** - Only trainee-side functionality
3. **Production Ready** - Comprehensive error handling
4. **Defensive Rendering** - Safe handling of undefined/null
5. **Responsive UI** - Loading, error, and empty states
6. **JWT Authentication** - Secure API communication
7. **Pull-to-Refresh** - Easy data updates
8. **Material Support** - PDFs, videos, documents, images
9. **Status Tracking** - Assignment and course progress
10. **Certificate Management** - View and download certificates

## 🔄 Data Refresh

All screens support pull-to-refresh:
- Swipe down to refresh data
- Shows loading indicator
- Updates UI with latest data
- Handles errors gracefully

## 📝 Notes

- All screens use the existing theme system
- Navigation is integrated with React Navigation
- API client handles token refresh automatically
- All endpoints match the Django backend structure
- No hardcoded data or mock responses
- Safe rendering prevents crashes from missing data
- Consistent error handling across all screens
