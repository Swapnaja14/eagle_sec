"""
Comprehensive authentication diagnostic script
Run this on BOTH laptops and compare the output
Usage: python diagnose_auth_issue.py
"""
import os
import sys
import django

# Fix Windows encoding issue
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model, authenticate
from django.db import connection
import hashlib

User = get_user_model()

print("=" * 70)
print("AUTHENTICATION DIAGNOSTIC REPORT")
print("=" * 70)

# 1. Database Connection Info
print("\n[1] DATABASE CONFIGURATION")
print("-" * 70)
db_config = settings.DATABASES['default']
print(f"Engine: {db_config['ENGINE']}")
if 'HOST' in db_config:
    print(f"Host: {db_config.get('HOST', 'N/A')}")
if 'NAME' in db_config:
    print(f"Database: {db_config['NAME']}")

# 2. Check Django Settings
print("\n[2] DJANGO SETTINGS")
print("-" * 70)
print(f"SECRET_KEY (first 10 chars): {settings.SECRET_KEY[:10]}...")
print(f"DEBUG: {settings.DEBUG}")
print(f"AUTH_USER_MODEL: {settings.AUTH_USER_MODEL}")
print(f"PASSWORD_HASHERS: {len(settings.PASSWORD_HASHERS) if hasattr(settings, 'PASSWORD_HASHERS') else 'default'}")

# 3. Test Users
print("\n[3] TEST USER ANALYSIS")
print("-" * 70)
test_users = ['admin', 'instructor', 'trainee']

for username in test_users:
    try:
        user = User.objects.get(username=username)
        print(f"\n[OK] User: {username}")
        print(f"  - ID: {user.id}")
        print(f"  - Email: {user.email}")
        print(f"  - Role: {user.role}")
        print(f"  - Active: {user.is_active}")
        print(f"  - Staff: {user.is_staff}")
        print(f"  - Password Hash (first 20 chars): {user.password[:20]}...")
        print(f"  - Password Algorithm: {user.password.split('$')[0] if '$' in user.password else 'unknown'}")
        
        # Test authentication
        test_password = f"{username}123"
        auth_user = authenticate(username=username, password=test_password)
        
        if auth_user:
            print(f"  - [SUCCESS] Authentication: SUCCESS with password '{test_password}'")
        else:
            print(f"  - [FAILED] Authentication: FAILED with password '{test_password}'")
            
            # Try to check password manually
            is_valid = user.check_password(test_password)
            print(f"  - Manual check_password(): {is_valid}")
            
    except User.DoesNotExist:
        print(f"\n[NOT FOUND] User '{username}' NOT FOUND in database")

# 4. Database Query Test
print("\n[4] RAW DATABASE QUERY")
print("-" * 70)
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT id, username, email, is_active, password 
        FROM accounts_user 
        WHERE username IN ('admin', 'instructor', 'trainee')
        ORDER BY username
    """)
    rows = cursor.fetchall()
    print(f"Found {len(rows)} users in database:")
    for row in rows:
        user_id, username, email, is_active, password_hash = row
        print(f"  - {username}: ID={user_id}, Active={is_active}, Hash={password_hash[:30]}...")

# 5. Authentication Backend Test
print("\n[5] AUTHENTICATION BACKENDS")
print("-" * 70)
from django.contrib.auth import get_backends
backends = get_backends()
print(f"Configured backends: {len(backends)}")
for backend in backends:
    print(f"  - {backend.__class__.__module__}.{backend.__class__.__name__}")

# 6. JWT Configuration
print("\n[6] JWT CONFIGURATION")
print("-" * 70)
jwt_settings = settings.SIMPLE_JWT
print(f"ACCESS_TOKEN_LIFETIME: {jwt_settings.get('ACCESS_TOKEN_LIFETIME')}")
print(f"AUTH_HEADER_TYPES: {jwt_settings.get('AUTH_HEADER_TYPES')}")
print(f"UPDATE_LAST_LOGIN: {jwt_settings.get('UPDATE_LAST_LOGIN')}")

# 7. Test Login API Directly
print("\n[7] SIMULATED API LOGIN TEST")
print("-" * 70)
from rest_framework.test import APIClient
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

client = APIClient()

for username in ['trainee', 'instructor', 'admin']:
    password = f"{username}123"
    
    # Test using serializer directly
    try:
        serializer = TokenObtainPairSerializer(data={
            'username': username,
            'password': password
        })
        
        if serializer.is_valid():
            print(f"[SUCCESS] {username}: Serializer validation SUCCESS")
            tokens = serializer.validated_data
            print(f"   Access token generated: {str(tokens['access'])[:30]}...")
        else:
            print(f"[FAILED] {username}: Serializer validation FAILED")
            print(f"   Errors: {serializer.errors}")
    except Exception as e:
        print(f"[ERROR] {username}: Exception during serializer test")
        print(f"   Error: {str(e)}")

# 8. Environment Check
print("\n[8] ENVIRONMENT INFO")
print("-" * 70)
import sys
import platform
print(f"Python version: {sys.version}")
print(f"Platform: {platform.platform()}")
print(f"Django version: {django.get_version()}")

try:
    import rest_framework
    print(f"DRF version: {rest_framework.__version__}")
except:
    print("DRF version: Unable to determine")

try:
    import rest_framework_simplejwt
    print(f"SimpleJWT version: {rest_framework_simplejwt.__version__}")
except:
    print("SimpleJWT version: Unable to determine")

print("\n" + "=" * 70)
print("DIAGNOSTIC COMPLETE")
print("=" * 70)
print("\nRun this script on BOTH laptops and compare:")
print("  - Password hashes (should be IDENTICAL)")
print("  - Authentication results (should both be SUCCESS)")
print("  - SECRET_KEY (should be IDENTICAL)")
print("  - Python/Django versions (should be compatible)")
