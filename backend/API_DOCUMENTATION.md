# E-Learning Platform API Documentation

## 🎯 Overview

This backend serves as the **single source of truth** for both web and mobile applications. All data is accessed via REST APIs with JWT authentication.

**Base URL:** `http://localhost:8000/api/`

---

## 🔐 Authentication

### Register New User
**POST** `/api/auth/register/`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "trainee"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "trainee",
    "tenant": null,
    "avatar": null,
    "department": ""
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### Login
**POST** `/api/auth/login/`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "trainee"
  }
}
```

---

### Logout
**POST** `/api/auth/logout/`

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200):**
```json
{
  "detail": "Successfully logged out."
}
```

**Important:** After logout:
- Web: Remove tokens from localStorage/sessionStorage
- Mobile: Remove tokens from AsyncStorage/SecureStore
- Backend: Refresh token is blacklisted

---

### Refresh Token
**POST** `/api/token/refresh/`

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### Get Current User
**GET** `/api/auth/me/`

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "trainee",
  "tenant": {
    "id": 1,
    "name": "Demo Organization"
  },
  "avatar": "/media/avatars/john.jpg",
  "department": "IT Security"
}
```

---

## 📚 Courses API

### List All Courses
**GET** `/api/courses/`

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `status` - Filter by status (draft, active, retired)
- `compliance_taxonomy` - Filter by compliance
- `skills_taxonomy` - Filter by skill
- `search` - Search in name/description
- `ordering` - Sort by field (e.g., `-created_at`)

**Response (200):**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "course_id": "CS-1-A1B2C3D4",
      "display_name": "Cybersecurity Fundamentals",
      "description": "Learn the basics of cybersecurity...",
      "status": "active",
      "compliance_taxonomy": "ISO 27001",
      "skills_taxonomy": "Threat Analysis",
      "start_date": null,
      "end_date": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "created_by": {
        "id": 1,
        "username": "admin",
        "first_name": "Admin"
      },
      "lessons": [
        {
          "id": 1,
          "title": "Introduction to Cybersecurity",
          "order": 1
        }
      ]
    }
  ]
}
```

---

### Get Single Course
**GET** `/api/courses/{id}/`

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "id": 1,
  "course_id": "CS-1-A1B2C3D4",
  "display_name": "Cybersecurity Fundamentals",
  "description": "Learn the basics of cybersecurity...",
  "status": "active",
  "compliance_taxonomy": "ISO 27001",
  "skills_taxonomy": "Threat Analysis",
  "lessons": [
    {
      "id": 1,
      "title": "Introduction to Cybersecurity",
      "order": 1,
      "files": [
        {
          "id": 1,
          "file": "/media/lesson_files/2024/01/intro.pdf",
          "original_filename": "intro.pdf",
          "file_type": "document",
          "language": "en"
        }
      ]
    }
  ],
  "pre_assessment": {
    "id": 1,
    "is_active": true,
    "time_limit_minutes": 30,
    "question_count": 5
  },
  "post_assessment": {
    "id": 1,
    "is_active": true,
    "passing_threshold": 80,
    "max_attempts": 3
  },
  "certification": {
    "id": 1,
    "template": "corporate_modern"
  }
}
```

---

### Create Course (Admin/Instructor)
**POST** `/api/courses/`

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "display_name": "New Security Course",
  "description": "Advanced security training",
  "status": "draft",
  "compliance_taxonomy": "ISO 27001",
  "skills_taxonomy": "Threat Analysis"
}
```

---

### Update Course
**PATCH** `/api/courses/{id}/`

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "status": "active",
  "description": "Updated description"
}
```

---

### Delete Course
**DELETE** `/api/courses/{id}/`

**Headers:** `Authorization: Bearer <access_token>`

**Response (204):** No content

---

## 🎓 Certificates API

### Generate Certificate
**POST** `/api/certificates/generate/`

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "submission_id": 123
}
```

**Response (201):**
```json
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
  "file_path": "/certificates/cert_1_john_doe.pdf",
  "issued_at": "2024-01-20T14:30:00Z",
  "download_url": "http://localhost:8000/api/certificates/1/download/"
}
```

**Conditions for Certificate Generation:**
- Submission must be completed
- User must have passed (score >= passing_threshold)
- Quiz must be linked to a course

---

### Get Certificate Details
**GET** `/api/certificates/{id}/`

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
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
```

---

### Download Certificate (PDF)
**GET** `/api/certificates/{id}/download/`

**Headers:** `Authorization: Bearer <access_token>`

**Response:** PDF file download

**Usage:**
- Web: Open in new tab or trigger download
- Mobile: Download and save to device storage

---

### Get User's Certificates
**GET** `/api/certificates/employee/{user_id}/`

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
[
  {
    "id": 1,
    "course": {
      "id": 1,
      "display_name": "Cybersecurity Fundamentals"
    },
    "issued_at": "2024-01-20T14:30:00Z",
    "download_url": "http://localhost:8000/api/certificates/1/download/"
  }
]
```

---

## 🔄 Data Synchronization

### How Updates Sync Between Web and Mobile

1. **Admin Panel Changes:**
   - Admin updates course → Database updated
   - Next API call from web/mobile → Gets latest data

2. **Real-time Sync Strategy:**
   - Mobile app: Fetch data on app launch
   - Web app: Fetch data on page load
   - Both: Refresh on user action (pull-to-refresh)

3. **No Hardcoded Data:**
   - All course data comes from `/api/courses/`
   - All certificates from `/api/certificates/`
   - All user data from `/api/auth/me/`

---

## 📱 Mobile-Specific Considerations

### Token Storage
```javascript
// React Native Example
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save tokens after login
await AsyncStorage.setItem('access_token', response.access);
await AsyncStorage.setItem('refresh_token', response.refresh);

// Use in API calls
const token = await AsyncStorage.getItem('access_token');
headers: { Authorization: `Bearer ${token}` }

// Remove on logout
await AsyncStorage.removeItem('access_token');
await AsyncStorage.removeItem('refresh_token');
```

### API Request Example
```javascript
const fetchCourses = async () => {
  const token = await AsyncStorage.getItem('access_token');
  
  const response = await fetch('http://your-server.com/api/courses/', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};
```

---

## 🌐 Web-Specific Considerations

### Token Storage
```javascript
// Save tokens after login
localStorage.setItem('access_token', response.access);
localStorage.setItem('refresh_token', response.refresh);

// Use in API calls
const token = localStorage.getItem('access_token');
headers: { Authorization: `Bearer ${token}` }

// Remove on logout
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
```

---

## 🛡️ Security Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely:**
   - Web: HttpOnly cookies (preferred) or localStorage
   - Mobile: SecureStore/Keychain
3. **Implement token refresh logic**
4. **Handle 401 errors (redirect to login)**
5. **Validate all inputs on backend**

---

## 🚀 Getting Started

### 1. Run Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 2. Create Token Blacklist Tables
```bash
python manage.py migrate token_blacklist
```

### 3. Seed Sample Data
```bash
python manage.py seed_sample_data
```

### 4. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 5. Run Server
```bash
python manage.py runserver
```

### 6. Test API
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Get Courses
curl -X GET http://localhost:8000/api/courses/ \
  -H "Authorization: Bearer <your_access_token>"
```

---

## 📊 Sample Test Credentials

After running `seed_sample_data`:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Instructor | instructor | instructor123 |
| Trainee | trainee | trainee123 |

---

## 🎯 Key Features

✅ JWT Authentication with token blacklisting
✅ Single source of truth for web & mobile
✅ 10 sample courses with lessons
✅ Dynamic certificate generation (PDF)
✅ Role-based access control
✅ Multi-tenant support
✅ Comprehensive filtering & search
✅ Automatic data sync across platforms

---

## 📞 Support

For issues or questions, check:
- Django Admin: `http://localhost:8000/admin/`
- API Root: `http://localhost:8000/api/`
- DRF Browsable API: Available when DEBUG=True
