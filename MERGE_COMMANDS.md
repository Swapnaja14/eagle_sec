# Quick Merge Commands Reference

## Before Merging

```bash
# 1. Commit all changes
git add .
git commit -m "feat: Add trainee courses API and fix media serving"

# 2. Create backup branch
git branch Authentication-backup

# 3. Check what will be merged
git diff origin/main...HEAD --name-only
```

## Perform Merge

```bash
# 1. Switch to main
git checkout main

# 2. Pull latest
git pull origin main

# 3. Merge Authentication branch
git merge Authentication
```

## If No Conflicts

```bash
# Push to remote
git push origin main

# Run migrations
cd backend
python manage.py migrate

# Test
python manage.py runserver
```

## If Conflicts Occur

```bash
# 1. Check which files have conflicts
git status

# 2. Open each conflicted file and resolve
# Look for <<<<<<< HEAD markers
# Keep both changes (usually)
# Remove conflict markers

# 3. After resolving all conflicts
git add .
git commit -m "Merge Authentication into main"

# 4. Run migrations
cd backend
python manage.py migrate

# 5. Test
python manage.py runserver
```

## Abort Merge (If Needed)

```bash
# Cancel the merge
git merge --abort

# Or reset to before merge
git reset --hard HEAD
```

## Post-Merge Verification

```bash
cd backend

# Check migrations
python manage.py showmigrations

# Run migrations
python manage.py migrate

# Verify department column
python check_department_column.py

# Verify media files
python check_media_files.py

# Test API
python test_trainee_courses_api.py

# Start server
python manage.py runserver
```

## Common Conflict Patterns

### Pattern 1: Import Conflicts

**Conflict:**
```python
<<<<<<< HEAD
from .views import ViewA, ViewB
=======
from .views import ViewA, ViewC
>>>>>>> Authentication
```

**Resolution:**
```python
from .views import ViewA, ViewB, ViewC
```

### Pattern 2: Function Addition

**Conflict:**
```python
<<<<<<< HEAD
def function_from_main():
    pass
=======
def function_from_auth():
    pass
>>>>>>> Authentication
```

**Resolution:**
```python
def function_from_main():
    pass

def function_from_auth():
    pass
```

### Pattern 3: URL Patterns

**Conflict:**
```python
urlpatterns = [
<<<<<<< HEAD
    path('new-route/', new_view),
=======
    path('trainee-courses/', trainee_courses_view),
>>>>>>> Authentication
]
```

**Resolution:**
```python
urlpatterns = [
    path('new-route/', new_view),
    path('trainee-courses/', trainee_courses_view),
]
```

## Emergency Recovery

### If Merge Goes Wrong

```bash
# Option 1: Abort merge
git merge --abort

# Option 2: Reset to before merge
git log --oneline  # Find commit hash
git reset --hard <commit-hash>

# Option 3: Restore from backup
git checkout Authentication-backup
git branch -D Authentication
git branch Authentication
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `git merge --abort` | Cancel ongoing merge |
| `git status` | Check conflict status |
| `git diff` | See changes |
| `git log --oneline` | View commit history |
| `git reset --hard HEAD` | Discard all changes |
| `git checkout <branch>` | Switch branches |

## Tips

✓ **DO:**
- Create backup branch first
- Read conflict markers carefully
- Keep both changes when possible
- Test after resolving
- Run migrations after merge

✗ **DON'T:**
- Delete code without understanding
- Rush the resolution
- Skip testing
- Forget to run migrations
- Merge without backup

## Need Help?

1. Read: `MERGE_CONFLICT_ANALYSIS.md`
2. Check: Git status and diff
3. Ask: Team members
4. Abort: If too complex

---

**Remember:** You can always abort the merge and try again!
