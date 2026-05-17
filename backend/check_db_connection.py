"""
Quick script to check database connection and user data
Run: python check_db_connection.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import connection

User = get_user_model()

print("=" * 60)
print("DATABASE CONNECTION CHECK")
print("=" * 60)

# Check database configuration
db_config = settings.DATABASES['default']
print(f"\n✓ Database Engine: {db_config['ENGINE']}")
if 'NAME' in db_config:
    print(f"✓ Database Name: {db_config['NAME']}")
if 'HOST' in db_config:
    print(f"✓ Database Host: {db_config.get('HOST', 'N/A')}")

# Test connection
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        print("\n✅ Database connection: SUCCESS")
except Exception as e:
    print(f"\n❌ Database connection: FAILED")
    print(f"   Error: {e}")
    exit(1)

# Check for users
print("\n" + "=" * 60)
print("USER DATA CHECK")
print("=" * 60)

try:
    user_count = User.objects.count()
    print(f"\n✓ Total users in database: {user_count}")
    
    if user_count == 0:
        print("\n⚠️  WARNING: No users found in database!")
        print("   Run: python manage.py seed_sample_data")
    else:
        print("\n✓ Sample users:")
        for user in User.objects.all()[:5]:
            print(f"   - {user.username} ({user.role})")
        
        # Check specific test users
        test_users = ['admin', 'instructor', 'trainee']
        print("\n✓ Test user status:")
        for username in test_users:
            exists = User.objects.filter(username=username).exists()
            status = "✅ EXISTS" if exists else "❌ MISSING"
            print(f"   - {username}: {status}")
            
except Exception as e:
    print(f"\n❌ Error checking users: {e}")

print("\n" + "=" * 60)
print("DIAGNOSIS COMPLETE")
print("=" * 60)
