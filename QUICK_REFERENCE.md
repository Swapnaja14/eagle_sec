# Quick Reference Card

## 🎯 What Was Fixed

### Issue 1: Department Column ✅
- **Error:** `column courses_course.department does not exist`
- **Fix:** Re-applied migrations
- **Status:** Working

### Issue 2: Media Files (404) ✅
- **Error:** Files not found
- **Fix:** Created directories + placeholder files
- **Status:** Ready for uploads

---

## 🚀 Quick Start

### 1. Start Server
```bash
cd backend
python manage.py runserver
```

### 2. Upload Files
**Django Admin:**
```
http://localhost:8000/admin/courses/lessonfile/
```

### 3. Test API
```bash
python test_trainee_courses_api.py
```

### 4. Test File Access
```
http://localhost:8000/media/lesson_files/2026/05/AT.pdf
```

---

## 📋 Key Commands

```bash
# Check database
python check_department_column.py
python check_indexes.py

# Check media
python check_media_files.py

# Create test files
python create_placeholder_files.py

# Test API
python test_trainee_courses_api.py

# Start server
python manage.py runserver
```

---

## 🔗 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/courses/trainee-courses/` | Get courses for trainee |
| `GET /api/courses/` | Get all courses |
| `POST /api/courses/{id}/lessons/{id}/files/` | Upload file |

---

## 📁 File Locations

| Type | Path |
|------|------|
| Media Root | `backend/media/` |
| Lesson Files | `backend/media/lesson_files/2026/05/` |
| URL Pattern | `/media/lesson_files/2026/05/filename.ext` |

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `ISSUES_FIXED_SUMMARY.md` | Complete summary |
| `UPLOAD_FILES_GUIDE.md` | How to upload files |
| `MOBILE_APP_INTEGRATION.md` | Mobile integration |
| `FIX_DEPARTMENT_COLUMN.md` | Department fix details |
| `MEDIA_FILES_FIX.md` | Media fix details |

---

## ✅ Status Checklist

- [x] Department column created
- [x] Database indexes added
- [x] Media directories created
- [x] URL configuration updated
- [x] Placeholder files created
- [x] API endpoint working
- [ ] Real files uploaded
- [ ] Mobile app tested

---

## 🎬 Next Steps

1. **Upload real files** via Django admin
2. **Test file access** in browser
3. **Integrate mobile app** using guides
4. **Deploy to production** (optional)

---

## 🆘 Need Help?

- Read: `UPLOAD_FILES_GUIDE.md`
- Read: `MOBILE_APP_INTEGRATION.md`
- Run: `python check_media_files.py`
- Check: Django admin at `http://localhost:8000/admin/`

---

**Status: ✅ ALL ISSUES FIXED - READY TO USE**
