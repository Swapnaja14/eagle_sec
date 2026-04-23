# 🚀 Quick Reference Guide

## Common Commands

### Development Server
```bash
cd backend
python manage.py runserver
```

### Database Operations
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (CAUTION: Deletes all data)
python manage.py flush

# Create superuser
python manage.py createsuperuser

# Seed sample data
python manage.py seed_sample_data
```

### Shell Access
```bash
# Django shell
python manage.py shell

# Example: Create a user
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.create_user(username='test', password='test123')
```

---

## API Quick Tests

### 1. Register User
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "confirm_password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User",
    "role": "trainee"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 3. Get Current User
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. List Courses
```bash
curl -X GET http://localhost:8000/api/courses/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Get Single Course
```bash
curl -X GET http://localhost:8000/api/courses/1/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Logout
```bash
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

---

## Mobile App Code Snippets

### Login Function
```javascript
const login = async (username, password) => {
  try {
    const response = await fetch('http://YOUR_IP:8000/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      await AsyncStorage.setItem('access_token', data.access);
      await AsyncStorage.setItem('refresh_token', data.refresh);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, data };
    } else {
      return { success: false, error: data.detail || 'Login failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Fetch Courses
```javascript
const fetchCourses = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    
    const response = await fetch('http://YOUR_IP:8000/api/courses/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, courses: data.results };
    } else {
      return { success: false, error: 'Failed to fetch courses' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Logout Function
```javascript
const logout = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    const refresh = await AsyncStorage.getItem('refresh_token');
    
    await fetch('http://YOUR_IP:8000/api/auth/logout/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh })
    });
    
    // Clear storage regardless of response
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user');
    
    return { success: true };
  } catch (error) {
    // Still clear storage on error
    await AsyncStorage.clear();
    return { success: true };
  }
};
```

### Download Certificate
```javascript
const downloadCertificate = async (certificateId) => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    
    const response = await fetch(
      `http://YOUR_IP:8000/api/certificates/${certificateId}/download/`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (response.ok) {
      const blob = await response.blob();
      // Handle file download/save
      return { success: true, blob };
    } else {
      return { success: false, error: 'Download failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

---

## Web App Code Snippets

### Axios Setup
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refresh = localStorage.getItem('refresh_token');
        const response = await axios.post(
          'http://localhost:8000/api/token/refresh/',
          { refresh }
        );
        
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### Usage
```javascript
import api from './api';

// Login
const login = async (username, password) => {
  const response = await api.post('/auth/login/', { username, password });
  localStorage.setItem('access_token', response.data.access);
  localStorage.setItem('refresh_token', response.data.refresh);
  return response.data;
};

// Get courses
const getCourses = async () => {
  const response = await api.get('/courses/');
  return response.data;
};

// Logout
const logout = async () => {
  const refresh = localStorage.getItem('refresh_token');
  await api.post('/auth/logout/', { refresh });
  localStorage.clear();
};
```

---

## Common Issues & Solutions

### Issue: CORS Error
**Solution:** Ensure CORS is configured in `settings.py`:
```python
CORS_ALLOW_ALL_ORIGINS = True  # Development only
CORS_ALLOW_CREDENTIALS = True
```

### Issue: Token Expired
**Solution:** Implement token refresh logic:
```javascript
// Check if token is expired before request
// If 401 response, refresh token
// Retry original request with new token
```

### Issue: Mobile can't connect
**Solution:** 
1. Use your computer's IP address (not localhost)
2. Ensure firewall allows connections
3. Run server with: `python manage.py runserver 0.0.0.0:8000`

### Issue: Certificate generation fails
**Solution:**
```bash
# Ensure certificates directory exists
mkdir certificates

# Check file permissions
chmod 755 certificates
```

---

## Environment Variables

### Development (.env)
```env
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.100
USE_SQLITE=True
CORS_ALLOW_ALL_ORIGINS=True
```

### Production (.env)
```env
SECRET_KEY=your-super-secret-production-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
USE_SQLITE=False
DB_NAME=learnsphere_db
DB_USER=postgres
DB_PASSWORD=strong_password
DB_HOST=db.yourdomain.com
DB_PORT=5432
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## Useful Django Commands

```bash
# Show all migrations
python manage.py showmigrations

# Create empty migration
python manage.py makemigrations --empty appname

# SQL for migration
python manage.py sqlmigrate appname 0001

# Check for issues
python manage.py check

# Collect static files
python manage.py collectstatic

# Clear cache
python manage.py clear_cache

# Database shell
python manage.py dbshell
```

---

## Testing Checklist

- [ ] User registration works
- [ ] Login returns JWT tokens
- [ ] Token refresh works
- [ ] Logout blacklists token
- [ ] Courses list returns data
- [ ] Course detail shows lessons
- [ ] Certificate generation works
- [ ] Certificate download works
- [ ] Admin panel accessible
- [ ] Mobile app can connect
- [ ] Web app can connect
- [ ] Data syncs across platforms

---

## Performance Tips

1. **Use pagination:** API returns 20 items per page by default
2. **Cache responses:** Cache course list on client side
3. **Lazy load images:** Load course images on demand
4. **Optimize queries:** Backend uses `select_related` and `prefetch_related`
5. **Token refresh:** Only refresh when needed (on 401 error)

---

## Security Checklist

- [ ] JWT tokens stored securely
- [ ] HTTPS in production
- [ ] Strong SECRET_KEY
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS configured
- [ ] CORS properly configured
- [ ] Regular security updates
- [ ] Input validation
- [ ] Rate limiting (consider django-ratelimit)
- [ ] SQL injection protection (Django ORM)

---

**Quick Reference Complete! 🎯**
