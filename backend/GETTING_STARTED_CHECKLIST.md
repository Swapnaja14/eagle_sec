# ✅ Getting Started Checklist

Follow this checklist to get your e-learning platform backend up and running.

---

## 📋 Initial Setup

### Step 1: Environment Setup
- [ ] Python 3.10+ installed
- [ ] Navigate to `backend` directory
- [ ] Create virtual environment: `python -m venv env`
- [ ] Activate virtual environment:
  - Windows: `env\Scripts\activate`
  - Mac/Linux: `source env/bin/activate`

### Step 2: Install Dependencies
- [ ] Run: `pip install -r requirements.txt`
- [ ] Verify installation: `pip list`

### Step 3: Configure Environment
- [ ] Create `.env` file in `backend` directory
- [ ] Add required variables:
  ```env
  SECRET_KEY=your-secret-key-here
  DEBUG=True
  ALLOWED_HOSTS=localhost,127.0.0.1
  USE_SQLITE=True
  ```

### Step 4: Database Setup
- [ ] Run: `python manage.py migrate`
- [ ] Run: `python manage.py migrate token_blacklist`
- [ ] Verify: Check for `db.sqlite3` file

### Step 5: Load Sample Data
- [ ] Run: `python manage.py seed_sample_data`
- [ ] Verify: Should see success messages for:
  - ✅ Tenant created
  - ✅ 3 users created (admin, instructor, trainee)
  - ✅ 10 courses created

### Step 6: Start Server
- [ ] Run: `python manage.py runserver`
- [ ] Verify: Server running at http://localhost:8000
- [ ] Check: No error messages in console

---

## 🧪 Testing

### Test 1: Admin Panel
- [ ] Open: http://localhost:8000/admin/
- [ ] Login with: `admin` / `admin123`
- [ ] Verify: Can see all models (Users, Courses, etc.)
- [ ] Check: 10 courses visible in Courses section

### Test 2: API Root
- [ ] Open: http://localhost:8000/api/
- [ ] Verify: See API endpoints listed
- [ ] Check: DRF browsable API loads

### Test 3: Login API
- [ ] Open terminal/Postman
- [ ] Test login:
  ```bash
  curl -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}'
  ```
- [ ] Verify: Receive `access` and `refresh` tokens
- [ ] Save: Copy access token for next tests

### Test 4: Get Courses
- [ ] Test courses endpoint:
  ```bash
  curl -X GET http://localhost:8000/api/courses/ \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
  ```
- [ ] Verify: Receive list of 10 courses
- [ ] Check: Each course has lessons, assessments

### Test 5: Get Current User
- [ ] Test me endpoint:
  ```bash
  curl -X GET http://localhost:8000/api/auth/me/ \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
  ```
- [ ] Verify: Receive user profile data
- [ ] Check: Role is "admin"

### Test 6: Logout
- [ ] Test logout:
  ```bash
  curl -X POST http://localhost:8000/api/auth/logout/ \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"refresh": "YOUR_REFRESH_TOKEN"}'
  ```
- [ ] Verify: Receive success message
- [ ] Check: Old token no longer works

---

## 📱 Mobile App Integration

### Preparation
- [ ] Note your computer's IP address
  - Windows: `ipconfig`
  - Mac/Linux: `ifconfig`
- [ ] Update mobile app API base URL to: `http://YOUR_IP:8000/api`
- [ ] Ensure firewall allows connections on port 8000

### Test from Mobile
- [ ] Run server with: `python manage.py runserver 0.0.0.0:8000`
- [ ] Test login from mobile app
- [ ] Verify: Can fetch courses
- [ ] Check: Can view course details
- [ ] Test: Logout functionality

---

## 🌐 Web App Integration

### Preparation
- [ ] Web app API base URL: `http://localhost:8000/api`
- [ ] CORS configured in Django settings
- [ ] Token storage implemented (localStorage)

### Test from Web
- [ ] Test login from web app
- [ ] Verify: Tokens stored in localStorage
- [ ] Check: Can fetch and display courses
- [ ] Test: Logout clears tokens

---

## 📊 Verify Sample Data

### Check Users
- [ ] Admin panel → Users
- [ ] Verify 3 users exist:
  - admin (Admin role)
  - instructor (Instructor role)
  - trainee (Trainee role)

### Check Courses
- [ ] Admin panel → Courses
- [ ] Verify 10 courses exist
- [ ] Check each course has:
  - 4 lessons
  - Pre-assessment
  - Post-assessment
  - Certification

### Check Tenant
- [ ] Admin panel → Tenants
- [ ] Verify "Demo Organization" exists
- [ ] Check: All users belong to this tenant

---

## 🔐 Security Verification

### JWT Configuration
- [ ] Check `settings.py`:
  - `rest_framework_simplejwt` in INSTALLED_APPS
  - `rest_framework_simplejwt.token_blacklist` in INSTALLED_APPS
  - JWT settings configured
- [ ] Verify token blacklisting works (logout test)

### CORS Configuration
- [ ] Check `settings.py`:
  - `corsheaders` in INSTALLED_APPS
  - CORS middleware configured
  - CORS settings appropriate for environment

### Password Security
- [ ] Verify passwords are hashed (check database)
- [ ] Test: Cannot login with wrong password
- [ ] Check: Password validators configured

---

## 📚 Documentation Review

### Read Documentation
- [ ] Read: `API_DOCUMENTATION.md`
- [ ] Read: `SETUP_GUIDE.md`
- [ ] Read: `QUICK_REFERENCE.md`
- [ ] Skim: `DEPLOYMENT_GUIDE.md` (for later)
- [ ] Review: `PROJECT_SUMMARY.md`

### Understand Architecture
- [ ] Understand: Single source of truth concept
- [ ] Know: How data syncs between platforms
- [ ] Learn: JWT authentication flow
- [ ] Review: API endpoint structure

---

## 🚀 Next Steps

### Development
- [ ] Customize course content
- [ ] Add more sample data if needed
- [ ] Customize certificate templates
- [ ] Add custom business logic
- [ ] Implement additional features

### Integration
- [ ] Complete mobile app integration
- [ ] Complete web app integration
- [ ] Test end-to-end workflows
- [ ] Handle edge cases
- [ ] Implement error handling

### Deployment (When Ready)
- [ ] Review `DEPLOYMENT_GUIDE.md`
- [ ] Set up production database (PostgreSQL)
- [ ] Configure production settings
- [ ] Set up HTTPS/SSL
- [ ] Deploy to cloud provider
- [ ] Test production environment

---

## 🐛 Troubleshooting

### If Server Won't Start
- [ ] Check: Virtual environment activated
- [ ] Check: All dependencies installed
- [ ] Check: Migrations applied
- [ ] Check: No port conflicts (8000)
- [ ] Review: Error messages in console

### If Login Fails
- [ ] Verify: User exists in database
- [ ] Check: Correct username/password
- [ ] Verify: JWT settings configured
- [ ] Check: Token blacklist migrations applied

### If Courses Don't Load
- [ ] Verify: Sample data seeded
- [ ] Check: Authorization header included
- [ ] Verify: Token is valid
- [ ] Check: CORS configured correctly

### If Mobile Can't Connect
- [ ] Use: Computer's IP (not localhost)
- [ ] Check: Firewall allows connections
- [ ] Run: `python manage.py runserver 0.0.0.0:8000`
- [ ] Verify: Mobile and computer on same network

---

## ✅ Completion Checklist

### Backend Ready When:
- [x] Server starts without errors
- [x] Admin panel accessible
- [x] API endpoints respond correctly
- [x] JWT authentication works
- [x] Sample data loaded
- [x] Logout blacklists tokens
- [x] Courses API returns data
- [x] Documentation reviewed

### Integration Ready When:
- [ ] Mobile app can login
- [ ] Mobile app can fetch courses
- [ ] Mobile app can logout
- [ ] Web app can login
- [ ] Web app can fetch courses
- [ ] Web app can logout
- [ ] Data syncs across platforms

### Production Ready When:
- [ ] PostgreSQL configured
- [ ] DEBUG=False
- [ ] Strong SECRET_KEY set
- [ ] HTTPS configured
- [ ] CORS properly configured
- [ ] Static files served
- [ ] Monitoring set up
- [ ] Backups configured

---

## 📞 Need Help?

### Resources
- Check: `API_DOCUMENTATION.md` for API details
- Check: `QUICK_REFERENCE.md` for common commands
- Check: Django admin for data verification
- Check: Server logs for error messages

### Common Issues
- Virtual environment not activated
- Dependencies not installed
- Migrations not applied
- Wrong credentials
- CORS not configured
- Firewall blocking connections

---

## 🎉 Success!

When all items are checked, you have:
- ✅ Fully functional Django backend
- ✅ JWT authentication with logout
- ✅ 10 sample courses loaded
- ✅ Certificate generation ready
- ✅ API ready for web and mobile
- ✅ Single source of truth established

**You're ready to build your e-learning platform! 🚀**

---

**Current Status:** [ ] Complete Setup | [ ] Testing | [ ] Integration | [ ] Production
