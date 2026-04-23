# 🎓 E-Learning Platform - Full Stack

## Overview

A comprehensive e-learning platform with Django REST Framework backend serving both web and mobile applications. The backend acts as a **single source of truth** ensuring all updates sync automatically across all platforms.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                │
│                  Django REST API Backend                 │
│              (JWT Auth + PostgreSQL/SQLite)              │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Web App    │    │  Mobile App  │    │ Admin Panel  │
│   (React)    │    │ (React Native│    │   (Django)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## ✨ Key Features

### 🔐 Authentication
- JWT-based authentication (SimpleJWT)
- Token blacklisting for secure logout
- Role-based access control (Superadmin, Admin, Instructor, Trainee)
- Multi-tenant support

### 📚 Course Management
- 10 pre-loaded sample courses
- Lessons with multimedia support (videos, documents, presentations)
- Pre and post assessments
- Progress tracking
- Course cloning functionality

### 🎓 Certificates
- Dynamic PDF certificate generation
- Unique certificate IDs
- Download API for web and mobile
- Template customization

### 📊 Analytics & Reporting
- Employee progress tracking
- Trainer performance metrics
- Attendance monitoring
- Comprehensive analytics dashboard

### 🔄 Real-time Sync
- All platforms consume same REST API
- No hardcoded data in frontends
- Instant updates across web and mobile
- Admin changes reflect immediately

---

## 📁 Project Structure

```
eagle_sec/
├── backend/                    # Django REST API
│   ├── accounts/              # Authentication & users
│   ├── courses/               # Course management
│   ├── certificates/          # Certificate generation
│   ├── assessments/           # Quizzes & submissions
│   ├── dashboard/             # Training sessions
│   ├── attendance/            # Attendance tracking
│   ├── feedback/              # Feedback system
│   ├── analytics/             # Analytics & reports
│   ├── content/               # Content management
│   ├── questions/             # Question bank
│   ├── learnsphere/           # Django settings
│   ├── utils/                 # Utilities (PDF gen)
│   ├── requirements.txt
│   ├── API_DOCUMENTATION.md
│   └── SETUP_GUIDE.md
│
├── mobile/                     # React Native app
│   └── src/
│       └── screens/
│
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv env
env\Scripts\activate  # Windows
# source env/bin/activate  # Mac/Linux
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:**
Create `backend/.env`:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
USE_SQLITE=True
```

5. **Run migrations:**
```bash
python manage.py migrate
python manage.py migrate token_blacklist
```

6. **Seed sample data:**
```bash
python manage.py seed_sample_data
```

7. **Start server:**
```bash
python manage.py runserver
```

**Test Credentials:**
- Admin: `admin` / `admin123`
- Instructor: `instructor` / `instructor123`
- Trainee: `trainee` / `trainee123`

---

## 📱 Mobile App Integration

### React Native Example

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://YOUR_SERVER_IP:8000/api';

// Login
const login = async (username, password) => {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  await AsyncStorage.setItem('access_token', data.access);
  await AsyncStorage.setItem('refresh_token', data.refresh);
  return data;
};

// Get Courses
const getCourses = async () => {
  const token = await AsyncStorage.getItem('access_token');
  const response = await fetch(`${API_BASE}/courses/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Logout
const logout = async () => {
  const token = await AsyncStorage.getItem('access_token');
  const refresh = await AsyncStorage.getItem('refresh_token');
  
  await fetch(`${API_BASE}/auth/logout/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh })
  });
  
  await AsyncStorage.removeItem('access_token');
  await AsyncStorage.removeItem('refresh_token');
};
```

---

## 🌐 Web App Integration

### JavaScript/React Example

```javascript
const API_BASE = 'http://localhost:8000/api';

// Login
const login = async (username, password) => {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  return data;
};

// Get Courses
const getCourses = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE}/courses/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

---

## 🔑 Core API Endpoints

### Authentication
```
POST   /api/auth/register/          # Register new user
POST   /api/auth/login/             # Login (get JWT tokens)
POST   /api/auth/logout/            # Logout (blacklist token)
POST   /api/token/refresh/          # Refresh access token
GET    /api/auth/me/                # Get current user
PATCH  /api/auth/me/update/         # Update profile
```

### Courses
```
GET    /api/courses/                # List all courses
GET    /api/courses/{id}/           # Get course details
POST   /api/courses/                # Create course (admin)
PATCH  /api/courses/{id}/           # Update course
DELETE /api/courses/{id}/           # Delete course
GET    /api/courses/{id}/lessons/   # Get course lessons
```

### Certificates
```
POST   /api/certificates/generate/              # Generate certificate
GET    /api/certificates/{id}/                  # Get certificate details
GET    /api/certificates/{id}/download/         # Download PDF
GET    /api/certificates/employee/{user_id}/    # User's certificates
```

---

## 📊 Sample Data

After running `seed_sample_data`, you get:

### 10 Courses:
1. Cybersecurity Fundamentals
2. Network Security Essentials
3. Cloud Security Best Practices
4. Incident Response & Forensics
5. Penetration Testing Fundamentals
6. Secure Coding in Python
7. DevSecOps Pipeline Security
8. GDPR Compliance Training
9. Kubernetes Security
10. Security Awareness for Employees

Each course includes:
- 4 lessons
- Pre-assessment (5 questions)
- Post-assessment (10 questions, 80% passing)
- Certificate template

---

## 🔄 Data Synchronization

### How It Works

1. **Admin updates course in Django admin**
   - Course data saved to database

2. **Web app fetches courses**
   - `GET /api/courses/` → Returns latest data

3. **Mobile app fetches courses**
   - `GET /api/courses/` → Returns same latest data

4. **Result:** Both platforms always show identical, up-to-date information

### No Hardcoded Data
- ❌ Don't hardcode courses in mobile app
- ❌ Don't duplicate data in frontend
- ✅ Always fetch from API
- ✅ Single source of truth in database

---

## 🛡️ Security Features

- JWT authentication with token rotation
- Token blacklisting on logout
- Password hashing (Django default)
- Role-based access control
- Tenant isolation
- CORS configuration
- Input validation
- SQL injection protection (Django ORM)

---

## 📚 Documentation

- **API Documentation:** `backend/API_DOCUMENTATION.md`
- **Setup Guide:** `backend/SETUP_GUIDE.md`
- **Django Admin:** http://localhost:8000/admin/
- **API Root:** http://localhost:8000/api/

---

## 🧪 Testing

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Test Get Courses
```bash
curl -X GET http://localhost:8000/api/courses/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Use PostgreSQL (not SQLite)
- [ ] Enable HTTPS
- [ ] Set up proper CORS
- [ ] Configure static/media file serving
- [ ] Set up monitoring
- [ ] Regular backups
- [ ] Security updates

---

## 🛠️ Tech Stack

### Backend
- Django 6.0.3
- Django REST Framework 3.17.1
- SimpleJWT 5.5.1
- PostgreSQL / SQLite
- ReportLab (PDF generation)

### Frontend (Mobile)
- React Native
- AsyncStorage
- Fetch API

### Frontend (Web)
- React
- LocalStorage
- Fetch API / Axios

---

## 📞 Support & Resources

- **Django Docs:** https://docs.djangoproject.com/
- **DRF Docs:** https://www.django-rest-framework.org/
- **SimpleJWT:** https://django-rest-framework-simplejwt.readthedocs.io/
- **React Native:** https://reactnative.dev/

---

## 🎯 Key Principles

1. **Single Source of Truth:** Backend database is the only source
2. **API-First:** All data accessed via REST API
3. **Platform Agnostic:** Same API for web, mobile, and future platforms
4. **Secure by Default:** JWT auth, token blacklisting, role-based access
5. **Scalable:** Multi-tenant architecture ready for growth

---

## 📝 License

This project is for educational purposes.

---

## 👥 Contributors

Built for e-learning platform with web and mobile support.

---

**Happy Learning! 🎓**
