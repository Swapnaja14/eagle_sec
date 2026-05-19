# Frontend Quick Start Guide

## 🚀 Quick Integration

### Base URL
```javascript
const API_BASE_URL = "http://localhost:8000";
```

### Test Credentials
```javascript
// Trainee
username: "amit_210"
password: "Pass@123"

// Trainer
username: "vaishu_210"
password: "Pass@123"
```

---

## 1. Authentication

```javascript
// Login
const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.access);
  localStorage.setItem('refresh', data.refresh);
  return data;
};

// Get current user
const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

---

## 2. Dashboard

```javascript
const getDashboard = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/trainee/dashboard/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Usage
const data = await getDashboard();
console.log(data.my_training);        // Courses
console.log(data.upcoming_sessions);  // Sessions
console.log(data.pending_assessments); // Quizzes
```

---

## 3. Countdown Timer

```javascript
const getActiveSubmission = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/assessments/submissions/active_submission/`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (response.ok) {
      return await response.json();
    }
    return null; // No active quiz
  } catch (error) {
    return null;
  }
};

// Timer Component
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(null);
  
  useEffect(() => {
    const fetchTimer = async () => {
      const submission = await getActiveSubmission();
      if (submission) {
        setTimeLeft(submission.time_remaining_seconds);
      }
    };
    
    fetchTimer();
    const interval = setInterval(fetchTimer, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (!timeLeft) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  if (!timeLeft) return null;
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return (
    <div className="countdown-timer">
      ⏱️ {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}
```

---

## 4. Courses with Enrolled Count

```javascript
const getCourses = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `${API_BASE_URL}/api/courses/trainee/my-courses/`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return await response.json();
};

// Usage
const data = await getCourses();
data.courses.forEach(course => {
  console.log(`${course.title}: ${course.enrolled_count} enrolled`);
});
```

---

## 5. Certificate Generation

```javascript
const generateCertificate = async (courseId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/auto-generate/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ course_id: courseId })
    }
  );
  
  if (response.ok) {
    const cert = await response.json();
    window.open(cert.download_url, '_blank');
    return cert;
  } else {
    const error = await response.json();
    throw new Error(error.detail);
  }
};

// Usage
try {
  await generateCertificate(1);
  alert('Certificate generated!');
} catch (error) {
  alert(error.message);
}
```

---

## 6. Complete Example

```javascript
import React, { useState, useEffect } from 'react';

function TraineeApp() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadDashboard();
  }, []);
  
  const loadDashboard = async () => {
    try {
      const data = await getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="app">
      {/* Countdown Timer */}
      <CountdownTimer />
      
      {/* Dashboard */}
      <div className="dashboard">
        <h1>My Training</h1>
        
        {/* Courses */}
        <div className="courses">
          {dashboard.my_training.map(course => (
            <div key={course.id} className="course-card">
              <h3>{course.module}</h3>
              <p>Status: {course.status}</p>
              {course.score && <p>Score: {course.score}%</p>}
              {course.certificateReady && (
                <button onClick={() => downloadCertificate(course.certificate_id)}>
                  Download Certificate
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Upcoming Sessions */}
        <h2>Upcoming Sessions</h2>
        <div className="sessions">
          {dashboard.upcoming_sessions.map(session => (
            <div key={session.id} className="session-card">
              <h3>{session.module}</h3>
              <p>📅 {session.date}</p>
              <p>👨‍🏫 {session.trainer}</p>
              <p>{session.type === 'virtual' ? '💻' : '🏫'} {session.venue}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TraineeApp;
```

---

## 7. Error Handling

```javascript
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Request failed');
  }
  
  return await response.json();
};
```

---

## 8. CSS Styles

```css
/* Countdown Timer */
.countdown-timer {
  position: fixed;
  top: 10px;
  right: 10px;
  background: #4CAF50;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  z-index: 1000;
}

.countdown-timer.warning {
  background: #FF9800;
}

.countdown-timer.critical {
  background: #F44336;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Course Card */
.course-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
}

.course-card h3 {
  margin: 0 0 8px 0;
}

/* Session Card */
.session-card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
}
```

---

## 9. Testing

```javascript
// Test login
const testLogin = async () => {
  const data = await login('amit_210', 'Pass@123');
  console.log('Login successful:', data);
};

// Test dashboard
const testDashboard = async () => {
  const data = await getDashboard();
  console.log('Dashboard:', data);
};

// Test courses
const testCourses = async () => {
  const data = await getCourses();
  console.log('Courses:', data);
};

// Run all tests
testLogin()
  .then(testDashboard)
  .then(testCourses)
  .catch(console.error);
```

---

## 10. Mobile App (React Native)

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Login
const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  await AsyncStorage.setItem('token', data.access);
  return data;
};

// Get Dashboard
const getDashboard = async () => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/trainee/dashboard/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

---

## Status: ✅ Ready to Use

All endpoints are tested and working!

**Test Credentials**:
- Trainee: `amit_210` / `Pass@123`
- Trainer: `vaishu_210` / `Pass@123`

**Base URL**: `http://localhost:8000`

**Documentation**: See `FRONTEND_INTEGRATION_GUIDE.md` for details
