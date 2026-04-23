# 🚀 E-Learning Platform Backend Setup Guide

## Overview

This Django backend serves as the **single source of truth** for both web and mobile applications. All changes made through the admin panel or APIs automatically reflect across all platforms.

---

## 📋 Prerequisites

- Python 3.10+
- PostgreSQL (optional, SQLite works for development)
- pip or pipenv

---

## 🛠️ Installation Steps

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python -m venv env

# Activate (Windows)
env\Scripts\activate

# Activate (Mac/Linux)
source env/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Django Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# Database (SQLite by default)
USE_SQLITE=True

# PostgreSQL (if USE_SQLITE=False)
DB_NAME=learnsphere_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

### 5. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Token Blacklist Tables
```bash
python manage.py migrate token_blacklist
```

### 7. Seed Sample Data (10 Courses + Users)
```bash
python manage.py seed_sample_data
```

This creates:
- 1 Admin user: `admin` / `admin123`
- 1 Instructor: `instructor` / `instructor123`
- 1 Trainee: `trainee` / `trainee123`
- 10 Sample courses with lessons
- Pre/Post assessments for each course
- Certificate templates

### 8. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 9. Run Development Server
```bash
python manage.py runserver
```

Server will start at: `http://localhost:8000`

---

## 🧪 Testing the API

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"admin\", \"password\": \"admin123\"}"
```

### Test Get Courses
```bash
curl -X GET http://localhost:8000/api/courses/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Logout
```bash
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refresh\": \"YOUR_REFRESH_TOKEN\"}"
```

---

## 🌐 Access Points

- **API Root:** http://localhost:8000/api/
- **Admin Panel:** http://localhost:8000/admin/
- **DRF Browsable API:** Available when DEBUG=True

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
  
  // Store tokens
  await AsyncStorage.setItem('access_token', data.access);
  await AsyncStorage.setItem('refresh_token', data.refresh);
  
  return data;
};

// Fetch Courses
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
  
  // Clear local storage
  await AsyncStorage.removeItem('access_token');
  await AsyncStorage.removeItem('refresh_token');
};
```

---

## 🌍 Web App Integration

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
  
  // Store tokens
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  
  return data;
};

// Fetch Courses
const getCourses = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE}/courses/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};

// Logout
const logout = async () => {
  const token = localStorage.getItem('access_token');
  const refresh = localStorage.getItem('refresh_token');
  
  await fetch(`${API_BASE}/auth/logout/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh })
  });
  
  // Clear local storage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};
```

---

## 🔄 Data Synchronization Flow

### How Updates Sync Between Platforms

```
┌─────────────┐
│ Admin Panel │ ──► Update Course
└─────────────┘
       │
       ▼
┌─────────────┐
│  Database   │ ◄── Single Source of Truth
└─────────────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Web App  │   │Mobile App│   │  API     │
│ (React)  │   │(React N.)│   │ Clients  │
└──────────┘   └──────────┘   └──────────┘
```

**Key Points:**
1. Admin updates course → Database updated immediately
2. Web/Mobile fetch data via API → Always get latest data
3. No hardcoded data in frontend
4. All platforms consume same REST API

---

## 📊 Sample Data Overview

After running `seed_sample_data`, you'll have:

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
- Pre-assessment (5 questions, 30 min)
- Post-assessment (10 questions, 80% passing)
- Certificate template

---

## 🎯 Key Features

✅ **JWT Authentication**
- Access tokens (2 hours)
- Refresh tokens (7 days)
- Token blacklisting on logout

✅ **Single Source of Truth**
- All data served via REST API
- No platform-specific data
- Instant sync across web/mobile

✅ **Role-Based Access**
- Superadmin: Full access
- Admin: Tenant-scoped management
- Instructor: Course management
- Trainee: Course consumption

✅ **Certificate Generation**
- Dynamic PDF generation
- Downloadable via API
- Unique certificate IDs

✅ **Multi-Tenant Support**
- Isolated data per organization
- Tenant-scoped queries
- Shared infrastructure

---

## 🔐 Security Checklist

### Development
- ✅ JWT authentication enabled
- ✅ Token blacklisting configured
- ✅ CORS configured for local development
- ✅ Password hashing (Django default)

### Production
- [ ] Set `DEBUG=False`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Use HTTPS only
- [ ] Use PostgreSQL (not SQLite)
- [ ] Set up proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up monitoring/logging
- [ ] Regular security updates

---

## 📁 Project Structure

```
backend/
├── accounts/          # User authentication & management
├── courses/           # Course management
├── certificates/      # Certificate generation
├── assessments/       # Quizzes & submissions
├── dashboard/         # Training sessions
├── attendance/        # Attendance tracking
├── feedback/          # Feedback system
├── analytics/         # Analytics & reporting
├── content/           # Content management
├── questions/         # Question bank
├── learnsphere/       # Django settings
├── utils/             # Utilities (PDF generation)
├── manage.py
├── requirements.txt
└── API_DOCUMENTATION.md
```

---

## 🐛 Troubleshooting

### Issue: Migration errors
```bash
# Reset migrations (development only!)
python manage.py migrate --fake
python manage.py migrate
```

### Issue: Token blacklist not working
```bash
# Ensure token_blacklist app is installed
python manage.py migrate token_blacklist
```

### Issue: CORS errors from mobile
```env
# In .env, ensure CORS is configured
CORS_ALLOW_ALL_ORIGINS=True  # Development only!
```

### Issue: Certificate generation fails
```bash
# Ensure certificates directory exists
mkdir certificates
```

---

## 📚 Additional Resources

- **API Documentation:** See `API_DOCUMENTATION.md`
- **Django Admin:** http://localhost:8000/admin/
- **DRF Docs:** https://www.django-rest-framework.org/
- **SimpleJWT:** https://django-rest-framework-simplejwt.readthedocs.io/

---

## 🎓 Next Steps

1. ✅ Complete backend setup
2. ✅ Test API endpoints
3. ✅ Review API documentation
4. 🔄 Integrate with web frontend
5. 🔄 Integrate with mobile app
6. 🔄 Deploy to production

---

## 💡 Tips

- Use DRF Browsable API for testing (when DEBUG=True)
- Check Django admin for data verification
- Monitor logs for debugging
- Use Postman/Insomnia for API testing
- Keep tokens secure (never commit to git)

---

## 📞 Support

For issues:
1. Check logs: `python manage.py runserver` output
2. Verify migrations: `python manage.py showmigrations`
3. Test with admin panel first
4. Review API documentation

---

**Happy Coding! 🚀**
