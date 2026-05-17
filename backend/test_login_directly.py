"""
Simple script to test login credentials directly
Usage: python test_login_directly.py
"""
import os
import sys
import django

# Fix Windows encoding issue
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from django.contrib.auth import authenticate, get_user_model

User = get_user_model()

print("=" * 60)
print("DIRECT LOGIN TEST")
print("=" * 60)

# Test credentials
test_credentials = [
    ('trainee', 'trainee123'),
    ('instructor', 'instructor123'),
    ('admin', 'admin123'),
]

for username, password in test_credentials:
    print(f"\nTesting: {username} / {password}")
    print("-" * 60)
    
    # Check if user exists
    try:
        user = User.objects.get(username=username)
        print(f"[OK] User exists in database")
        print(f"  - Email: {user.email}")
        print(f"  - Active: {user.is_active}")
        print(f"  - Password hash: {user.password[:50]}...")
        
        # Test password check
        is_valid = user.check_password(password)
        print(f"  - check_password(): {'[SUCCESS] VALID' if is_valid else '[FAILED] INVALID'}")
        
        # Test authenticate
        auth_user = authenticate(username=username, password=password)
        if auth_user:
            print(f"  - authenticate(): [SUCCESS] SUCCESS")
        else:
            print(f"  - authenticate(): [FAILED] FAILED")
            
    except User.DoesNotExist:
        print(f"[NOT FOUND] User does not exist in database")

print("\n" + "=" * 60)
print("If check_password() returns INVALID, the password hash is wrong.")
print("Solution: Reset the password on this laptop:")
print("  python manage.py shell")
print("  >>> from django.contrib.auth import get_user_model")
print("  >>> User = get_user_model()")
print("  >>> user = User.objects.get(username='trainee')")
print("  >>> user.set_password('trainee123')")
print("  >>> user.save()")
print("=" * 60)
