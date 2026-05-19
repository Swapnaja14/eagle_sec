# Trainee Courses Feature - Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRAINEE MOBILE APP                        │
│                                                                  │
│  ┌────────────────┐         ┌──────────────────┐               │
│  │  Login Screen  │────────▶│  Courses Screen  │               │
│  └────────────────┘         └──────────────────┘               │
│         │                            │                          │
│         │ 1. Login                   │ 2. Fetch Courses         │
│         │                            │                          │
└─────────┼────────────────────────────┼──────────────────────────┘
          │                            │
          ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                              │
│                                                                  │
│  POST /api/auth/login/          GET /api/courses/trainee-courses/│
│         │                                    │                   │
│         │                                    │                   │
│         ▼                                    ▼                   │
│  ┌──────────────┐                  ┌──────────────────┐        │
│  │ Auth Service │                  │ Courses ViewSet  │        │
│  └──────────────┘                  └──────────────────┘        │
│         │                                    │                   │
│         │ Returns JWT Token                 │                   │
│         │                                    │                   │
│         │                                    ▼                   │
│         │                          ┌──────────────────┐        │
│         │                          │ Filter by:       │        │
│         │                          │ - Tenant         │        │
│         │                          │ - Department     │        │
│         │                          │ - Status=active  │        │
│         │                          └──────────────────┘        │
│         │                                    │                   │
└─────────┼────────────────────────────────────┼──────────────────┘
          │                                    │
          ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                          DATABASE                                │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Users   │  │ Courses  │  │ Lessons  │  │ LessonFiles  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│       │             │              │               │            │
│       │             │              │               │            │
│  ┌────────────┐    │              │               │            │
│  │  Tenants   │◀───┘              │               │            │
│  └────────────┘                   │               │            │
│                                    │               │            │
│                    ┌───────────────┘               │            │
│                    │                               │            │
│                    └───────────────────────────────┘            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Request Flow

### Step 1: Authentication

```
Mobile App                    Backend                    Database
    │                            │                           │
    │  POST /api/auth/login/     │                           │
    ├───────────────────────────▶│                           │
    │  {username, password}      │                           │
    │                            │  Query User               │
    │                            ├──────────────────────────▶│
    │                            │                           │
    │                            │  User + Tenant Data       │
    │                            │◀──────────────────────────┤
    │                            │                           │
    │  {access_token, user}      │                           │
    │◀───────────────────────────┤                           │
    │                            │                           │
```

### Step 2: Fetch Courses

```
Mobile App                    Backend                    Database
    │                            │                           │
    │  GET /trainee-courses/     │                           │
    ├───────────────────────────▶│                           │
    │  Authorization: Bearer...  │                           │
    │                            │                           │
    │                            │  1. Verify JWT Token      │
    │                            │  2. Extract User Info     │
    │                            │                           │
    │                            │  Query Courses WHERE:     │
    │                            │  - tenant = user.tenant   │
    │                            │  - dept = user.dept       │
    │                            │  - status = 'active'      │
    │                            ├──────────────────────────▶│
    │                            │                           │
    │                            │  Courses + Lessons +      │
    │                            │  Files Data               │
    │                            │◀──────────────────────────┤
    │                            │                           │
    │                            │  3. Serialize Data        │
    │                            │  4. Calculate Stats       │
    │                            │                           │
    │  {count, courses[...]}     │                           │
    │◀───────────────────────────┤                           │
    │                            │                           │
```

## Data Filtering Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    FILTERING PROCESS                         │
└─────────────────────────────────────────────────────────────┘

Input: Authenticated Trainee User
   │
   ├─▶ Extract user.tenant (Company)
   │
   ├─▶ Extract user.department (Department)
   │
   ▼
┌─────────────────────────────────────────────────────────────┐
│  Query: Course.objects.filter(                              │
│    tenant = user.tenant,          ← Company Match           │
│    department = user.department,  ← Department Match        │
│    status = 'active'              ← Only Active Courses     │
│  )                                                           │
└─────────────────────────────────────────────────────────────┘
   │
   ├─▶ Prefetch lessons
   │
   ├─▶ Prefetch lesson files
   │
   ▼
┌─────────────────────────────────────────────────────────────┐
│  Result: Filtered Courses with:                             │
│  - All matching courses                                     │
│  - All lessons per course                                   │
│  - All files per lesson (videos, documents, presentations)  │
└─────────────────────────────────────────────────────────────┘
   │
   ▼
Output: JSON Response with courses, lessons, and files
```

## Response Data Structure

```
{
  count: 3,
  courses: [
    {
      id: 1,
      course_id: "CS-1-ABC123",
      display_name: "Course Name",
      department: "IT Security",
      
      // Summary Statistics
      total_videos: 5,
      total_documents: 8,
      total_files: 13,
      
      // Assessment Flags
      has_pre_assessment: true,
      has_post_assessment: true,
      
      // Nested Lessons
      lessons: [
        {
          id: 1,
          title: "Lesson 1",
          order: 1,
          file_count: 3,
          
          // Nested Files
          files: [
            {
              id: 1,
              original_filename: "video.mp4",
              file: "/media/...",
              file_type: "video",
              language: "en",
              allow_offline_download: true
            },
            {
              id: 2,
              original_filename: "notes.pdf",
              file: "/media/...",
              file_type: "document",
              language: "en",
              allow_offline_download: true
            }
          ]
        }
      ]
    }
  ]
}
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY CHECKS                           │
└─────────────────────────────────────────────────────────────┘

Request Received
   │
   ├─▶ 1. Check JWT Token
   │      ├─ Valid? ──▶ Continue
   │      └─ Invalid? ──▶ 401 Unauthorized
   │
   ├─▶ 2. Check User Role
   │      ├─ Trainee? ──▶ Continue
   │      └─ Other? ──▶ 403 Forbidden
   │
   ├─▶ 3. Check Tenant
   │      ├─ Has Tenant? ──▶ Continue
   │      └─ No Tenant? ──▶ Empty Result
   │
   ├─▶ 4. Filter by Tenant
   │      └─ Only user's company courses
   │
   ├─▶ 5. Filter by Department (if set)
   │      └─ Only matching department courses
   │
   └─▶ 6. Return Filtered Data
          └─ User sees only authorized courses
```

## Mobile App Usage Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP FLOW                           │
└─────────────────────────────────────────────────────────────┘

App Launch
   │
   ├─▶ Check if user is logged in
   │      ├─ Yes: Load token from storage
   │      └─ No: Show login screen
   │
   ├─▶ Navigate to Courses Screen
   │
   ├─▶ Show loading indicator
   │
   ├─▶ Call API: GET /trainee-courses/
   │      │
   │      ├─ Success:
   │      │    ├─ Parse response
   │      │    ├─ Display courses in list
   │      │    └─ Cache data locally
   │      │
   │      └─ Error:
   │           ├─ 401: Redirect to login
   │           ├─ 403: Show error message
   │           └─ Network: Show retry button
   │
   ├─▶ User taps on course
   │
   ├─▶ Navigate to Course Detail Screen
   │
   ├─▶ Display lessons and files
   │
   └─▶ User taps on file
          │
          ├─ Video: Open video player
          ├─ Document: Open document viewer
          └─ Download: Save to device (if allowed)
```

## Database Relationships

```
┌──────────┐
│  Tenant  │
└────┬─────┘
     │
     │ 1:N
     │
┌────▼─────┐
│   User   │
└────┬─────┘
     │
     │ Department (String)
     │
┌────▼─────────┐
│   Course     │◀─── Filtered by:
│              │     - tenant
│  - tenant    │     - department
│  - dept      │     - status='active'
│  - status    │
└────┬─────────┘
     │
     │ 1:N
     │
┌────▼─────────┐
│   Lesson     │
│              │
│  - title     │
│  - order     │
└────┬─────────┘
     │
     │ 1:N
     │
┌────▼─────────┐
│ LessonFile   │
│              │
│  - file      │
│  - type      │
│  - language  │
└──────────────┘
```

## Summary

This feature provides:

1. **Automatic Filtering:** Courses filtered by company and department
2. **Complete Data:** All lessons and files included
3. **Optimized Queries:** Efficient database access
4. **Security:** Role-based access control
5. **Mobile-Ready:** JSON response optimized for mobile apps

The trainee mobile app can now fetch and display courses with all their videos and documents in a single API call.
