# Frontend Integration Guide - Fixed Issues

## Issues Fixed

1. ✅ **Countdown timer not updating** - Added real-time countdown fields
2. ✅ **Course showing in explore but not in dashboard** - Dashboard now shows department courses
3. ✅ **Certificate not being created** - Auto-generate endpoint available
4. ✅ **Upcoming sessions from trainer** - Filtered by trainer's department

---

## 1. Quiz Countdown Timer (Top Right)

### Get Active Submission with Countdown
**Endpoint**: `GET /api/assessments/submissions/active_submission/`

**Response**:
```json
{
  "id": 1,
  "status": "in_progress",
  "started_at": "2026-05-19T18:00:00Z",
  "time_limit_minutes": 30,
  "deadline": "2026-05-19T18:30:00Z",
  "time_remaining_seconds": 1200,
  "quiz_title": "Cybersecurity Quiz",
  "user_name": "trainee"
}
```

### Frontend Implementation (React/React Native)

```javascript
import { useState, useEffect } from 'react';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [submission, setSubmission] = useState(null);
  
  // Fetch active submission
  useEffect(() => {
    const fetchActiveSubmission = async () => {
      try {
        const response = await fetch(
          '/api/assessments/submissions/active_submission/',
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setSubmission(data);
          setTimeLeft(data.time_remaining_seconds);
        }
      } catch (error) {
        console.log('No active submission');
      }
    };
    
    fetchActiveSubmission();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveSubmission, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up! Auto-submit
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  const handleAutoSubmit = async () => {
    if (!submission) return;
    
    await fetch(
      `/api/assessments/submissions/${submission.id}/complete_submission/`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    alert('Time expired! Quiz auto-submitted.');
    window.location.href = '/dashboard';
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!submission || timeLeft === null) {
    return null; // Don't show timer if no active quiz
  }
  
  const isWarning = timeLeft < 300; // Less than 5 minutes
  const isCritical = timeLeft < 60; // Less than 1 minute
  
  return (
    <div className={`countdown-timer ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''}`}>
      <span className="timer-icon">⏱️</span>
      <span className="timer-text">{formatTime(timeLeft)}</span>
    </div>
  );
}

export default CountdownTimer;
```

### CSS for Timer
```css
.countdown-timer {
  position: fixed;
  top: 10px;
  right: 10px;
  background: #4CAF50;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.countdown-timer.warning {
  background: #FF9800;
  animation: pulse 1s infinite;
}

.countdown-timer.critical {
  background: #F44336;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

---

## 2. Dashboard - Show All Courses

### Get Dashboard Data
**Endpoint**: `GET /api/trainee/dashboard/`

**Response**:
```json
{
  "my_training": [
    {
      "id": 1,
      "course_id": "CS-1-ABC123",
      "module": "Cybersecurity Fundamentals",
      "date": "2026-05-19",
      "score": 85,
      "status": "passed",
      "certificateReady": true,
      "certificate_id": 5
    },
    {
      "id": 2,
      "course_id": "CS-1-DEF456",
      "module": "Network Security",
      "date": "2026-05-18",
      "score": null,
      "status": "not-started",
      "certificateReady": false,
      "certificate_id": null
    }
  ],
  "upcoming_sessions": [...],
  "pending_assessments": [...]
}
```

### What Changed
- Dashboard now shows **both assigned courses AND department courses**
- Courses from trainers in the same department are automatically included
- Status can be: `passed`, `in-progress`, or `not-started`

### Frontend Implementation
```javascript
function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  
  useEffect(() => {
    const fetchDashboard = async () => {
      const response = await fetch('/api/trainee/dashboard/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDashboardData(data);
    };
    
    fetchDashboard();
  }, []);
  
  if (!dashboardData) return <div>Loading...</div>;
  
  return (
    <div className="dashboard">
      <h2>My Training ({dashboardData.my_training.length} courses)</h2>
      
      {dashboardData.my_training.length === 0 ? (
        <p>No training records yet. Browse courses to get started.</p>
      ) : (
        <div className="training-list">
          {dashboardData.my_training.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
      
      <h2>Upcoming Sessions</h2>
      <SessionsList sessions={dashboardData.upcoming_sessions} />
      
      <h2>Pending Assessments</h2>
      <AssessmentsList assessments={dashboardData.pending_assessments} />
    </div>
  );
}
```

---

## 3. Auto-Generate Certificate

### Generate Certificate After Course Completion
**Endpoint**: `POST /api/certificates/auto-generate/`

**Request**:
```json
{
  "course_id": 1
}
```

**Response** (Success):
```json
{
  "id": 5,
  "employee": 4,
  "course": 1,
  "issued_at": "2026-05-19T18:30:00Z",
  "download_url": "http://localhost:8000/api/certificates/5/download/"
}
```

**Response** (Not Completed):
```json
{
  "detail": "Course not completed yet. Current status: in_progress"
}
```

### Frontend Implementation
```javascript
function CertificateButton({ course }) {
  const [loading, setLoading] = useState(false);
  
  const generateCertificate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/certificates/auto-generate/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ course_id: course.id })
      });
      
      if (response.ok) {
        const cert = await response.json();
        // Download certificate
        window.open(cert.download_url, '_blank');
        alert('Certificate generated successfully!');
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to generate certificate');
      }
    } catch (error) {
      alert('Error generating certificate');
    } finally {
      setLoading(false);
    }
  };
  
  // Show button only if course is completed
  if (course.status !== 'passed' && course.status !== 'completed') {
    return null;
  }
  
  return (
    <button 
      onClick={generateCertificate}
      disabled={loading}
      className="btn-certificate"
    >
      {loading ? 'Generating...' : 
       course.certificateReady ? '📜 Download Certificate' : '🎓 Generate Certificate'}
    </button>
  );
}
```

---

## 4. Upcoming Sessions from Trainer

### Get Upcoming Sessions
**Endpoint**: `GET /api/trainee/dashboard/`

**Response** (upcoming_sessions):
```json
{
  "upcoming_sessions": [
    {
      "id": 1,
      "module": "Advanced Cybersecurity",
      "date": "2026-05-25 at 02:00 PM",
      "type": "virtual",
      "venue": "https://meet.google.com/abc-defg-hij",
      "trainer": "John Smith",
      "trainer_department": "IT Security"
    },
    {
      "id": 2,
      "module": "Network Security Basics",
      "date": "2026-05-26 at 10:00 AM",
      "type": "classroom",
      "venue": "Room 301, Building A",
      "trainer": "Jane Doe",
      "trainer_department": "IT Security"
    }
  ]
}
```

### What Changed
- Sessions are now filtered by **trainer's department**
- Shows sessions from trainers in the same department as trainee
- Includes trainer name and department
- Ordered by date (earliest first)

### Frontend Implementation
```javascript
function UpcomingSessions({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="empty-state">
        <p>No upcoming sessions scheduled</p>
      </div>
    );
  }
  
  return (
    <div className="sessions-list">
      {sessions.map(session => (
        <div key={session.id} className="session-card">
          <div className="session-header">
            <h3>{session.module}</h3>
            <span className={`session-type ${session.type}`}>
              {session.type === 'virtual' ? '💻 Virtual' : '🏫 Classroom'}
            </span>
          </div>
          
          <div className="session-details">
            <p>📅 {session.date}</p>
            <p>👨‍🏫 Trainer: {session.trainer}</p>
            {session.trainer_department && (
              <p>🏢 Department: {session.trainer_department}</p>
            )}
            
            {session.type === 'virtual' ? (
              <a href={session.venue} target="_blank" className="join-link">
                Join Meeting
              </a>
            ) : (
              <p>📍 {session.venue}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Complete Integration Example

```javascript
import React, { useState, useEffect } from 'react';
import CountdownTimer from './CountdownTimer';
import Dashboard from './Dashboard';
import CertificateButton from './CertificateButton';
import UpcomingSessions from './UpcomingSessions';

function TraineeApp() {
  const [dashboardData, setDashboardData] = useState(null);
  
  useEffect(() => {
    fetchDashboard();
  }, []);
  
  const fetchDashboard = async () => {
    const response = await fetch('/api/trainee/dashboard/', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setDashboardData(data);
  };
  
  return (
    <div className="trainee-app">
      {/* Countdown timer in top right */}
      <CountdownTimer />
      
      {/* Main content */}
      <div className="container">
        <h1>Welcome back, {dashboardData?.trainee?.name}!</h1>
        
        {/* Stats cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{dashboardData?.my_training?.length || 0}</h3>
            <p>Enrolled Courses</p>
          </div>
          <div className="stat-card">
            <h3>{dashboardData?.my_training?.filter(c => c.status === 'passed').length || 0}</h3>
            <p>Completed</p>
          </div>
          <div className="stat-card">
            <h3>{dashboardData?.my_training?.filter(c => c.certificateReady).length || 0}</h3>
            <p>Certificates</p>
          </div>
        </div>
        
        {/* My Training */}
        <section>
          <h2>My Training</h2>
          {dashboardData?.my_training?.length === 0 ? (
            <p>No training records yet. Browse courses to get started.</p>
          ) : (
            <div className="courses-grid">
              {dashboardData?.my_training?.map(course => (
                <div key={course.id} className="course-card">
                  <h3>{course.module}</h3>
                  <p>Status: {course.status}</p>
                  {course.score && <p>Score: {course.score}%</p>}
                  <CertificateButton course={course} />
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* Upcoming Sessions */}
        <section>
          <h2>Upcoming Sessions</h2>
          <UpcomingSessions sessions={dashboardData?.upcoming_sessions} />
        </section>
        
        {/* Pending Assessments */}
        <section>
          <h2>Pending Assessments</h2>
          {dashboardData?.pending_assessments?.map(assessment => (
            <div key={assessment.id} className="assessment-card">
              <h3>{assessment.module}</h3>
              <p>Questions: {assessment.questions}</p>
              <p>Time Limit: {assessment.timeLimit} minutes</p>
              <button onClick={() => startQuiz(assessment.id)}>
                Start Assessment
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default TraineeApp;
```

---

## Testing Checklist

### 1. Countdown Timer
- [ ] Timer appears in top right when quiz is active
- [ ] Timer counts down every second
- [ ] Timer turns orange when < 5 minutes
- [ ] Timer turns red when < 1 minute
- [ ] Quiz auto-submits when timer reaches 0
- [ ] Timer disappears when no active quiz

### 2. Dashboard Courses
- [ ] Shows assigned courses
- [ ] Shows department courses (not assigned)
- [ ] Shows correct status for each course
- [ ] Shows score for completed courses
- [ ] Shows certificate button when available

### 3. Certificate Generation
- [ ] Button appears for completed courses
- [ ] Clicking generates certificate
- [ ] Certificate downloads automatically
- [ ] Shows error if course not completed
- [ ] Prevents duplicate generation

### 4. Upcoming Sessions
- [ ] Shows sessions from same department
- [ ] Shows trainer name and department
- [ ] Shows correct date and time
- [ ] Virtual sessions have join link
- [ ] Classroom sessions show venue
- [ ] Ordered by date (earliest first)

---

## API Endpoints Summary

| Feature | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| Countdown Timer | GET | `/api/assessments/submissions/active_submission/` | Get active quiz with timer |
| Dashboard | GET | `/api/trainee/dashboard/` | Get all dashboard data |
| Certificate | POST | `/api/certificates/auto-generate/` | Generate certificate |
| Certificate | GET | `/api/certificates/{id}/download/` | Download certificate |

---

## Status: ✅ ALL ISSUES FIXED

Ready for frontend integration!
