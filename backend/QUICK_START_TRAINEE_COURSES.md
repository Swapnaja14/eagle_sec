# Quick Start Guide - Trainee Courses API

## For Backend Developers

### 1. Test the Endpoint

```bash
# Navigate to backend directory
cd backend

# Run the test script
python test_trainee_courses_api.py
```

Expected output:
```
============================================================
Testing Trainee Courses API Endpoint
============================================================

1. Logging in as trainee...
✓ Login successful! Access token obtained.

2. Fetching trainee courses...
✓ Successfully fetched courses!

Total courses: 3
...
```

### 2. Manual API Testing with cURL

```bash
# Step 1: Login as trainee
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "trainee", "password": "trainee123"}'

# Copy the access token from response

# Step 2: Fetch trainee courses
curl -X GET http://localhost:8000/api/courses/trainee-courses/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 3. Check Django Admin

```bash
# Start Django server
python manage.py runserver

# Open browser
http://localhost:8000/admin/

# Login with superuser credentials
# Navigate to:
# - Courses → Check active courses
# - Users → Check trainee's tenant and department
```

---

## For Mobile Developers

### 1. Install Dependencies

```bash
npm install @react-native-async-storage/async-storage
# or
yarn add @react-native-async-storage/async-storage
```

### 2. Create API Service

Create `services/api.js`:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://YOUR_SERVER_IP:8000/api';

export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    await AsyncStorage.setItem('access_token', data.access);
    await AsyncStorage.setItem('refresh_token', data.refresh);
  }
  
  return data;
};

export const getTraineeCourses = async () => {
  const token = await AsyncStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}/courses/trainee-courses/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return await response.json();
};
```

### 3. Use in Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { getTraineeCourses } from './services/api';

const CoursesScreen = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await getTraineeCourses();
      setCourses(data.courses);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <FlatList
      data={courses}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Text>{item.display_name}</Text>
          <Text>Videos: {item.total_videos}</Text>
          <Text>Documents: {item.total_documents}</Text>
        </View>
      )}
    />
  );
};

export default CoursesScreen;
```

### 4. Test on Device/Emulator

```bash
# For iOS
npx react-native run-ios

# For Android
npx react-native run-android
```

---

## Common Issues & Solutions

### Issue 1: Empty Course List

**Problem:** API returns `{"count": 0, "courses": []}`

**Solutions:**
1. Check if trainee has a tenant assigned
2. Check if trainee has a department set
3. Check if there are active courses in that department
4. Verify courses exist in Django admin

```bash
# Check in Django shell
python manage.py shell

from accounts.models import User
from courses.models import Course

# Check trainee
trainee = User.objects.get(username='trainee')
print(f"Tenant: {trainee.tenant}")
print(f"Department: {trainee.department}")

# Check courses
courses = Course.objects.filter(
    tenant=trainee.tenant,
    department=trainee.department,
    status='active'
)
print(f"Matching courses: {courses.count()}")
```

### Issue 2: 403 Forbidden

**Problem:** `{"detail": "This endpoint is only for trainees."}`

**Solution:** Ensure the user has role='trainee'

```python
# In Django shell
from accounts.models import User

user = User.objects.get(username='your_username')
user.role = 'trainee'
user.save()
```

### Issue 3: 401 Unauthorized

**Problem:** `{"detail": "Authentication credentials were not provided."}`

**Solutions:**
1. Check if token is included in Authorization header
2. Verify token format: `Bearer YOUR_TOKEN`
3. Check if token has expired (refresh it)

```javascript
// Check token in mobile app
const token = await AsyncStorage.getItem('access_token');
console.log('Token:', token);

// Refresh token if expired
const refreshToken = await AsyncStorage.getItem('refresh_token');
const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh: refreshToken }),
});
```

### Issue 4: Network Error on Mobile

**Problem:** Cannot connect to backend from mobile device

**Solutions:**

1. **For Android Emulator:**
   ```javascript
   const API_BASE_URL = 'http://10.0.2.2:8000/api';
   ```

2. **For iOS Simulator:**
   ```javascript
   const API_BASE_URL = 'http://localhost:8000/api';
   ```

3. **For Physical Device:**
   ```javascript
   // Use your computer's IP address
   const API_BASE_URL = 'http://192.168.1.100:8000/api';
   ```

4. **Allow external connections in Django:**
   ```python
   # settings.py
   ALLOWED_HOSTS = ['*']  # For development only!
   ```

---

## API Response Examples

### Success Response

```json
{
  "count": 2,
  "courses": [
    {
      "id": 1,
      "course_id": "CS-1-ABC123",
      "display_name": "Cybersecurity Fundamentals",
      "description": "Learn the basics...",
      "department": "IT Security",
      "status": "active",
      "total_videos": 3,
      "total_documents": 5,
      "total_files": 8,
      "has_pre_assessment": true,
      "has_post_assessment": true,
      "lessons": [
        {
          "id": 1,
          "title": "Introduction",
          "order": 1,
          "file_count": 2,
          "files": [
            {
              "id": 1,
              "original_filename": "intro.mp4",
              "file": "/media/lesson_files/2024/01/intro.mp4",
              "file_type": "video",
              "language": "en",
              "allow_offline_download": true
            }
          ]
        }
      ]
    }
  ]
}
```

### Empty Response (No Courses)

```json
{
  "count": 0,
  "courses": []
}
```

### Error Response (403)

```json
{
  "detail": "This endpoint is only for trainees."
}
```

---

## Useful Commands

### Backend

```bash
# Run migrations
python manage.py migrate

# Create test data
python manage.py seed_sample_data

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver 0.0.0.0:8000

# Django shell
python manage.py shell

# Run tests
python test_trainee_courses_api.py
```

### Mobile

```bash
# Install dependencies
npm install

# Start Metro bundler
npx react-native start

# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android

# Clear cache
npx react-native start --reset-cache

# Check logs
npx react-native log-ios
npx react-native log-android
```

---

## Next Steps

1. **Read Full Documentation:**
   - `API_DOCUMENTATION.md` - Complete API reference
   - `MOBILE_APP_INTEGRATION.md` - Detailed mobile integration
   - `TRAINEE_COURSES_FEATURE.md` - Feature overview
   - `TRAINEE_COURSES_FLOW.md` - System flow diagrams

2. **Implement Features:**
   - Course list screen
   - Course detail screen
   - Video player
   - Document viewer
   - Offline download

3. **Add Error Handling:**
   - Network errors
   - Authentication errors
   - Empty states
   - Loading states

4. **Optimize Performance:**
   - Cache API responses
   - Implement pull-to-refresh
   - Add pagination (if needed)
   - Optimize images/videos

---

## Support

Need help? Check:

1. **Documentation Files:**
   - `API_DOCUMENTATION.md`
   - `MOBILE_APP_INTEGRATION.md`
   - `TRAINEE_COURSES_FEATURE.md`

2. **Test Scripts:**
   - `test_trainee_courses_api.py`

3. **Django Admin:**
   - http://localhost:8000/admin/

4. **API Browser:**
   - http://localhost:8000/api/

---

## Quick Reference

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/api/auth/login/` | POST | No | Any | Login and get tokens |
| `/api/auth/me/` | GET | Yes | Any | Get current user info |
| `/api/courses/trainee-courses/` | GET | Yes | Trainee | Get filtered courses |
| `/api/courses/` | GET | Yes | Any | Get all courses |
| `/api/assignments/mine/` | GET | Yes | Trainee | Get my assignments |

---

**Happy Coding! 🚀**
