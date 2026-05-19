"""
Test mobile app endpoints for trainee access
"""
import requests

BASE_URL = "http://localhost:8000"
USERNAME = "amit_210"
PASSWORD = "Pass@123"

print("="*70)
print("TESTING MOBILE APP ENDPOINTS")
print("="*70)

# Login
print("\n1. Logging in...")
response = requests.post(f"{BASE_URL}/api/auth/login/", json={"username": USERNAME, "password": PASSWORD})
if response.status_code != 200:
    print(f"❌ Login failed: {response.status_code}")
    exit(1)

token = response.json()['access']
headers = {'Authorization': f'Bearer {token}'}
print("✅ Login successful")

# Test upcoming sessions endpoint
print("\n2. Testing /api/sessions/upcoming/")
response = requests.get(f"{BASE_URL}/api/sessions/upcoming/", headers=headers)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   ✅ Success - Found {len(data)} sessions")
    for s in data:
        print(f"      • {s['topic']} on {s['date_time']}")
else:
    print(f"   ❌ Failed: {response.text}")

# Test calendar endpoint
print("\n3. Testing /api/sessions/calendar/")
from datetime import datetime
from_date = datetime(2026, 5, 1).isoformat()
to_date = datetime(2026, 12, 31, 23, 59, 59).isoformat()
response = requests.get(f"{BASE_URL}/api/sessions/calendar/", headers=headers, params={'from': from_date, 'to': to_date})
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   ✅ Success - Found {data['count']} sessions")
    for s in data['results']:
        print(f"      • {s['topic']} on {s['date_time']}")
else:
    print(f"   ❌ Failed: {response.text}")

# Test trainee dashboard
print("\n4. Testing /api/trainee/dashboard/")
response = requests.get(f"{BASE_URL}/api/trainee/dashboard/", headers=headers)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   ✅ Success")
    print(f"      - My Training: {len(data.get('my_training', []))} courses")
    print(f"      - Recent Training: {len(data.get('recent_training', []))} courses")
    print(f"      - Upcoming Sessions: {len(data.get('upcoming_sessions', []))} sessions")
    print(f"      - Pending Assessments: {len(data.get('pending_assessments', []))} assessments")
else:
    print(f"   ❌ Failed: {response.text}")

print("\n" + "="*70)
print("ALL TESTS COMPLETED")
print("="*70)
