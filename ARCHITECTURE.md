# 🏗️ E-Learning Platform Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SINGLE SOURCE OF TRUTH                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Django REST Framework Backend                  │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │     JWT      │  │   Database   │  │     PDF      │  │   │
│  │  │     Auth     │  │  PostgreSQL  │  │  Generator   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │              REST API Endpoints                     │ │   │
│  │  │  /api/auth/  /api/courses/  /api/certificates/    │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/JSON
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Web App    │      │  Mobile App  │      │ Admin Panel  │
│   (React)    │      │(React Native)│      │   (Django)   │
│              │      │              │      │              │
│ localStorage │      │ AsyncStorage │      │   Session    │
│   + Fetch    │      │   + Fetch    │      │    Auth      │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## Data Flow

### 1. Authentication Flow

```
┌─────────┐                                    ┌─────────┐
│  Client │                                    │ Backend │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  POST /api/auth/login/                      │
     │  {username, password}                       │
     ├────────────────────────────────────────────>│
     │                                              │
     │                                         Verify
     │                                         Credentials
     │                                              │
     │  {access, refresh, user}                    │
     │<────────────────────────────────────────────┤
     │                                              │
  Store                                             │
  Tokens                                            │
     │                                              │
     │  GET /api/courses/                          │
     │  Authorization: Bearer <token>              │
     ├────────────────────────────────────────────>│
     │                                              │
     │                                         Verify
     │                                          Token
     │                                              │
     │  {courses: [...]}                           │
     │<────────────────────────────────────────────┤
     │                                              │
```

### 2. Course Sync Flow

```
┌──────────────┐         ┌──────────┐         ┌──────────┐
│ Admin Panel  │         │ Database │         │  Clients │
└──────┬───────┘         └────┬─────┘         └────┬─────┘
       │                      │                     │
       │ Update Course        │                     │
       ├─────────────────────>│                     │
       │                      │                     │
       │                   Saved                    │
       │                      │                     │
       │                      │  GET /api/courses/  │
       │                      │<────────────────────┤
       │                      │                     │
       │                      │  Latest Data        │
       │                      ├────────────────────>│
       │                      │                     │
       │                      │                  Display
       │                      │                  Updated
       │                      │                   Course
```

### 3. Certificate Generation Flow

```
┌─────────┐              ┌─────────┐              ┌─────────┐
│ Trainee │              │ Backend │              │   PDF   │
└────┬────┘              └────┬────┘              └────┬────┘
     │                        │                        │
     │ Complete Assessment    │                        │
     ├───────────────────────>│                        │
     │                        │                        │
     │                    Check Score                  │
     │                    (>= 80%)                     │
     │                        │                        │
     │                        │  Generate PDF          │
     │                        ├───────────────────────>│
     │                        │                        │
     │                        │  PDF Created           │
     │                        │<───────────────────────┤
     │                        │                        │
     │  Certificate URL       │                        │
     │<───────────────────────┤                        │
     │                        │                        │
     │ Download PDF           │                        │
     ├───────────────────────>│                        │
     │                        │                        │
     │  PDF File              │                        │
     │<───────────────────────┤                        │
     │                        │                        │
```

---

## Database Schema

### Core Tables

```
┌─────────────────┐
│     Tenant      │
├─────────────────┤
│ id              │
│ name            │
│ slug            │
│ logo            │
│ is_active       │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│      User       │
├─────────────────┤
│ id              │
│ username        │
│ email           │
│ password (hash) │
│ role            │
│ tenant_id (FK)  │
│ avatar          │
│ department      │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐         ┌─────────────────┐
│     Course      │         │     Lesson      │
├─────────────────┤         ├─────────────────┤
│ id              │    1:N  │ id              │
│ course_id       │◄────────┤ course_id (FK)  │
│ display_name    │         │ title           │
│ description     │         │ order           │
│ status          │         └─────────────────┘
│ tenant_id (FK)  │
│ created_by (FK) │         ┌─────────────────┐
└────────┬────────┘         │ PreAssessment   │
         │                  ├─────────────────┤
         │ 1:1              │ id              │
         ├─────────────────>│ course_id (FK)  │
         │                  │ time_limit      │
         │                  │ question_count  │
         │                  └─────────────────┘
         │
         │ 1:1              ┌─────────────────┐
         ├─────────────────>│ PostAssessment  │
         │                  ├─────────────────┤
         │                  │ id              │
         │                  │ course_id (FK)  │
         │                  │ passing_score   │
         │                  │ max_attempts    │
         │                  └─────────────────┘
         │
         │ 1:1              ┌─────────────────┐
         └─────────────────>│ Certification   │
                            ├─────────────────┤
                            │ id              │
                            │ course_id (FK)  │
                            │ template        │
                            └─────────────────┘

┌─────────────────────┐
│ IssuedCertificate   │
├─────────────────────┤
│ id                  │
│ employee_id (FK)    │
│ course_id (FK)      │
│ submission_id (FK)  │
│ file_path           │
│ issued_at           │
└─────────────────────┘
```

---

## API Architecture

### RESTful Endpoints

```
/api/
├── auth/
│   ├── register/          POST   - Create new user
│   ├── login/             POST   - Get JWT tokens
│   ├── logout/            POST   - Blacklist token
│   ├── me/                GET    - Get current user
│   └── me/update/         PATCH  - Update profile
│
├── token/
│   └── refresh/           POST   - Refresh access token
│
├── courses/
│   ├── /                  GET    - List courses
│   ├── /                  POST   - Create course
│   ├── /{id}/             GET    - Get course
│   ├── /{id}/             PATCH  - Update course
│   ├── /{id}/             DELETE - Delete course
│   ├── /{id}/lessons/     GET    - Get lessons
│   └── /{id}/clone/       POST   - Clone course
│
└── certificates/
    ├── generate/          POST   - Generate certificate
    ├── {id}/              GET    - Get certificate
    ├── {id}/download/     GET    - Download PDF
    └── employee/{id}/     GET    - User certificates
```

---

## Security Architecture

### Authentication Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: HTTPS/TLS                                     │
│  ├─ Encrypted communication                             │
│  └─ Certificate validation                              │
│                                                          │
│  Layer 2: CORS                                          │
│  ├─ Origin validation                                   │
│  └─ Allowed methods/headers                             │
│                                                          │
│  Layer 3: JWT Authentication                            │
│  ├─ Token signature verification                        │
│  ├─ Token expiration check                              │
│  └─ Token blacklist check                               │
│                                                          │
│  Layer 4: Role-Based Access                             │
│  ├─ User role verification                              │
│  ├─ Tenant isolation                                    │
│  └─ Permission checks                                   │
│                                                          │
│  Layer 5: Input Validation                              │
│  ├─ Serializer validation                               │
│  ├─ SQL injection protection                            │
│  └─ XSS protection                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### JWT Token Flow

```
┌──────────────────────────────────────────────────────┐
│                  JWT Token Lifecycle                  │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. Login                                            │
│     ├─ Verify credentials                            │
│     ├─ Generate access token (2 hours)               │
│     └─ Generate refresh token (7 days)               │
│                                                       │
│  2. API Request                                      │
│     ├─ Extract token from header                     │
│     ├─ Verify signature                              │
│     ├─ Check expiration                              │
│     ├─ Check blacklist                               │
│     └─ Extract user info                             │
│                                                       │
│  3. Token Refresh                                    │
│     ├─ Verify refresh token                          │
│     ├─ Generate new access token                     │
│     ├─ Rotate refresh token                          │
│     └─ Blacklist old refresh token                   │
│                                                       │
│  4. Logout                                           │
│     ├─ Receive refresh token                         │
│     ├─ Add to blacklist                              │
│     └─ Token becomes invalid                         │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Load Balancer / CDN                     │
│                    (CloudFlare)                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Reverse Proxy                          │
│                      (Nginx)                             │
│  ├─ SSL Termination                                     │
│  ├─ Static file serving                                 │
│  └─ Request routing                                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Application Server                          │
│                  (Gunicorn)                              │
│  ├─ Multiple workers                                    │
│  ├─ Process management                                  │
│  └─ Django application                                  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Database                               │
│                 (PostgreSQL)                             │
│  ├─ Connection pooling                                  │
│  ├─ Automated backups                                   │
│  └─ Replication (optional)                              │
└─────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling

```
                    ┌─────────────┐
                    │Load Balancer│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  App Server  │   │  App Server  │   │  App Server  │
│   Instance 1 │   │   Instance 2 │   │   Instance 3 │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │   Database   │
                  │  (Primary)   │
                  └──────┬───────┘
                         │
                         ├─────> Read Replica 1
                         └─────> Read Replica 2
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Backend Stack                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Framework:        Django 6.0.3                         │
│  API:              Django REST Framework 3.17.1         │
│  Authentication:   SimpleJWT 5.5.1                      │
│  Database:         PostgreSQL / SQLite                  │
│  PDF Generation:   ReportLab 4.2.2                      │
│  Image Processing: Pillow                               │
│  CORS:             django-cors-headers                  │
│  Filtering:        django-filter                        │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Frontend Stack                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Web:              React / Vue / Angular                │
│  Mobile:           React Native                         │
│  State:            Redux / Context API                  │
│  HTTP:             Axios / Fetch API                    │
│  Storage:          localStorage / AsyncStorage          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Key Architectural Principles

### 1. Single Source of Truth
- All data stored in one database
- No data duplication across platforms
- API as the only data access layer

### 2. Stateless Authentication
- JWT tokens for authentication
- No server-side sessions
- Scalable across multiple servers

### 3. API-First Design
- All functionality via REST API
- Platform-agnostic backend
- Easy to add new clients

### 4. Multi-Tenancy
- Data isolation per organization
- Shared infrastructure
- Scalable architecture

### 5. Security by Design
- Multiple security layers
- Token blacklisting
- Role-based access control
- Input validation

---

**Architecture Complete! 🏗️**
