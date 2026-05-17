# Merge Strategy: Keep Mobile Trainee, Exclude Website Trainee

## Goal
Merge mobile app trainee features and backend trainee support into main, while excluding website frontend trainee pages.

## Files to EXCLUDE from Merge (Website Trainee Pages)
These files should NOT be merged:
- `frontend/src/pages/TraineeDashboardPage.jsx`
- `frontend/src/pages/MyTrainingHistoryPage.jsx`
- `frontend/src/pages/MyCertificatesPage.jsx`
- `frontend/src/pages/TakeAssessmentPage.jsx`

## Files to INCLUDE in Merge

### Mobile App (Keep All)
- `mobile/src/screens/TakeAssessmentScreen.js`
- `mobile/src/screens/DashboardScreen.js`
- `mobile/src/screens/CatalogScreen.js`
- `mobile/src/screens/CourseDetailScreen.js`
- `mobile/src/screens/ProfileScreen.js`
- `mobile/src/screens/LoginScreen.js`
- `mobile/src/services/api.js`
- `mobile/App.js`
- `mobile/package.json`

### Backend (Keep Trainee Support)
- `backend/accounts/models.py` (trainee role)
- `backend/dashboard/views.py` (trainee endpoints)
- `backend/dashboard/urls.py` (trainee routes)
- `backend/courses/models.py` (trainee assignments)
- `backend/accounts/serializers.py`
- `backend/accounts/views.py`

### Frontend (Exclude Trainee Pages, Keep Other Changes)
- `frontend/src/App.jsx` (remove trainee routes)
- `frontend/src/context/AuthContext.jsx` (keep trainee role in backend mapping)
- `frontend/src/components/layout/AppLayout.jsx` (no trainee navigation)
- `frontend/src/pages/LoginPage.jsx` (no trainee signup option)
- `frontend/src/services/api.js` (keep trainee API endpoints for backend)

## Step-by-Step Merge Process

### Step 1: Create a Clean Branch from Main
```bash
# Fetch latest main
git fetch origin main

# Create new branch from main
git checkout -b merge-mobile-trainee origin/main
```

### Step 2: Cherry-Pick Mobile and Backend Changes
```bash
# Cherry-pick your commits but we'll selectively stage files
git checkout Authentication

# Create a patch of your changes
git diff origin/main > my-changes.patch
```

### Step 3: Manually Apply Changes (Recommended Approach)

#### A. Mobile App Changes (Apply All)
```bash
git checkout merge-mobile-trainee

# Copy mobile changes from Authentication branch
git checkout Authentication -- mobile/

# Stage mobile changes
git add mobile/
```

#### B. Backend Changes (Apply Trainee Support)
```bash
# Copy backend files that have trainee support
git checkout Authentication -- backend/accounts/models.py
git checkout Authentication -- backend/dashboard/views.py
git checkout Authentication -- backend/dashboard/urls.py
git checkout Authentication -- backend/courses/models.py
git checkout Authentication -- backend/accounts/serializers.py
git checkout Authentication -- backend/accounts/views.py

# Stage backend changes
git add backend/accounts/models.py
git add backend/dashboard/views.py
git add backend/dashboard/urls.py
git add backend/courses/models.py
git add backend/accounts/serializers.py
git add backend/accounts/views.py
```

#### C. Frontend Changes (Exclude Trainee Pages)
```bash
# Copy frontend changes but exclude trainee pages
git checkout Authentication -- frontend/src/context/AuthContext.jsx
git checkout Authentication -- frontend/src/services/api.js

# For App.jsx and LoginPage.jsx, we need to manually edit
# to remove trainee-specific parts

# DO NOT checkout these files:
# - frontend/src/pages/TraineeDashboardPage.jsx
# - frontend/src/pages/MyTrainingHistoryPage.jsx
# - frontend/src/pages/MyCertificatesPage.jsx
# - frontend/src/pages/TakeAssessmentPage.jsx
```

### Step 4: Manual Edits Required

#### Edit `frontend/src/App.jsx`
Remove these trainee routes:
- `/trainee/dashboard`
- `/trainee/training-history`
- `/trainee/certificates`
- `/trainee/assessment/:id`

Keep the role mapping for trainee in AuthContext but no routes.

#### Edit `frontend/src/pages/LoginPage.jsx`
Ensure trainee is NOT in signup options (should only show: Trainer, Admin, Super Admin)

#### Edit `frontend/src/context/AuthContext.jsx`
Keep trainee in ROLE_PERMISSIONS for backend compatibility:
```javascript
trainee: ['dashboard', 'calendar'],
```
But ensure no frontend routes use it.

### Step 5: Commit and Push
```bash
# Commit the changes
git add -A
git commit -m "feat: add mobile trainee app with backend support (exclude website trainee pages)"

# Push to remote
git push origin merge-mobile-trainee

# Create PR to main
```

## Alternative: Interactive Rebase Approach

If you want to keep commit history:

```bash
# Start interactive rebase
git checkout Authentication
git rebase -i origin/main

# In the editor, keep all commits
# Then after rebase, remove unwanted files:
git rm frontend/src/pages/TraineeDashboardPage.jsx
git rm frontend/src/pages/MyTrainingHistoryPage.jsx
git rm frontend/src/pages/MyCertificatesPage.jsx
git rm frontend/src/pages/TakeAssessmentPage.jsx

# Amend the commit
git commit --amend --no-edit

# Force push
git push --force-with-lease origin Authentication
```

## Verification Checklist

After merge, verify:
- [ ] Mobile app has trainee screens
- [ ] Backend has trainee role and endpoints
- [ ] Website frontend has NO trainee pages
- [ ] Website login has NO trainee signup option
- [ ] Website App.jsx has NO trainee routes
- [ ] Backend API still supports trainee (for mobile)
- [ ] README documents trainee as mobile-only

## Files to Delete from Website (if they exist)
```bash
git rm frontend/src/pages/TraineeDashboardPage.jsx
git rm frontend/src/pages/MyTrainingHistoryPage.jsx
git rm frontend/src/pages/MyCertificatesPage.jsx
git rm frontend/src/pages/TakeAssessmentPage.jsx
```

## Summary

**KEEP:**
- ✅ All mobile trainee screens
- ✅ Backend trainee role and API endpoints
- ✅ Backend trainee database models
- ✅ Trainee role mapping in AuthContext (for backend)

**REMOVE:**
- ❌ Website trainee dashboard page
- ❌ Website trainee training history page
- ❌ Website trainee certificates page
- ❌ Website trainee assessment page
- ❌ Trainee routes in frontend App.jsx
- ❌ Trainee signup option in LoginPage
- ❌ Trainee navigation in AppLayout
