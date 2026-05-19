import requests

BASE_URL = "http://localhost:8000"
USERNAME = "amit_210"
PASSWORD = "Pass@123"

# Login
response = requests.post(f"{BASE_URL}/api/auth/login/", json={"username": USERNAME, "password": PASSWORD})
token = response.json()['access']
headers = {'Authorization': f'Bearer {token}'}

# Check dashboard
dashboard = requests.get(f"{BASE_URL}/api/trainee/dashboard/", headers=headers).json()
print(f"✅ Upcoming Sessions in Dashboard: {len(dashboard['upcoming_sessions'])}")
for s in dashboard['upcoming_sessions']:
    print(f"   • {s['module']} on {s['date']} ({s['type']})")

# Check calendar for May 2026
from datetime import datetime
from_date = datetime(2026, 5, 1).isoformat()
to_date = datetime(2026, 5, 31, 23, 59, 59).isoformat()
calendar = requests.get(f"{BASE_URL}/api/sessions/calendar/", headers=headers, params={'from': from_date, 'to': to_date}).json()
print(f"\n✅ Sessions in Calendar (May 2026): {calendar['count']}")
for s in calendar['results']:
    print(f"   • {s['topic']} on {s['date_time']} ({s['type']})")
