# Manual Setup Steps

## ⚠️ Important: Merge Conflicts Detected

Your codebase has merge conflicts that need to be resolved before the project can run. Here's how to fix them:

### Step 1: Resolve Merge Conflicts

The following files have merge conflicts (look for `<<<<<<<`, `=======`, `>>>>>>>`):

1. **backend/dashboard/views.py** (line 207-290)
2. Any other files with merge markers

To fix:
1. Open each file in your editor
2. Search for `<<<<<<<`
3. Choose which version to keep (remove the conflict markers)
4. Save the file

### Step 2: Install Dependencies

```bash
cd backend
.\env\Scripts\activate
pip install django==6.0.3 djangorestframework==3.17.1 djangorestframework-simplejwt==5.5.1 django-cors-headers==4.9.0 django-filter==25.2 drf-nested-routers==0.95.0 python-decouple==3.8
```

### Step 3: Run Migrations

```bash
python manage.py migrate
python manage.py migrate token_blacklist
```

### Step 4: Seed Sample Data

```bash
python manage.py seed_sample_data
```

This will create:
- 1 Admin user: `admin` / `admin123`
- 1 Instructor: `instructor` / `instructor123`
- 1 Trainee: `trainee` / `trainee123`
- 10 Sample courses with lessons

### Step 5: Run Server

```bash
python manage.py runserver
```

Server will start at: http://localhost:8000

### Step 6: Test API

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ -H "Content-Type: application/json" -d "{\"username\": \"admin\", \"password\": \"admin123\"}"

# Get courses (use token from login response)
curl -X GET http://localhost:8000/api/courses/ -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Quick Fix for Merge Conflicts

If you want to quickly resolve conflicts, you can:

1. **Keep the newer version** (after `=======` and before `>>>>>>>`):
   - Delete everything from `<<<<<<<` to `=======` (including these lines)
   - Delete the `>>>>>>>` line

2. **Keep the older version** (after `<<<<<<<` and before `=======`):
   - Delete everything from `=======` to `>>>>>>>` (including these lines)
   - Delete the `<<<<<<<` line

3. **Merge both versions**:
   - Manually combine the code from both sections
   - Remove all conflict markers

## Alternative: Use Existing Database

If you already have a working database (`db.sqlite3`), you can skip migrations and just run:

```bash
python manage.py runserver
```

## Need Help?

Check the documentation:
- `API_DOCUMENTATION.md` - Complete API reference
- `SETUP_GUIDE.md` - Detailed setup instructions
- `QUICK_REFERENCE.md` - Common commands

## Current Status

✅ Dependencies can be installed (except Pillow/reportlab - not critical)
✅ JWT authentication configured
✅ Sample data seed command created
✅ API endpoints configured
⚠️  Merge conflicts need manual resolution
⚠️  Migrations blocked by merge conflicts

Once merge conflicts are resolved, the system will be fully functional!
