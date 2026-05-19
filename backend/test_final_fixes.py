"""
Test script for:
1. Calendar sessions filtering by department
2. Recent training section in dashboard
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"
USERNAME = "amit_210"
PASSWORD = "Pass@123"

def print_header(text):
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70)

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def get_auth_token(username, password):
    """Get JWT token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login/",
        json={"username": username, "password": password}
    )
    if response.status_code == 200:
        return response.json()['access']
    return None

def test_calendar_sessions(token):
    """Test calendar sessions filtering by department"""
    print_header("TEST 1: Calendar Sessions (Department Filtering)")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me/", headers=headers)
        if response.status_code == 200:
            user = response.json()
            print_info(f"User: {user['username']}")
            print_info(f"Department: {user.get('department', 'Not set')}")
            print_info(f"Tenant: {user.get('tenant', {}).get('name', 'Not set')}")
        
        # Get calendar sessions
        # Set date range for next 30 days
        now = datetime.now()
        date_from = now.strftime('%Y-%m-%dT%H:%M:%S')
        date_to = (now + timedelta(days=30)).strftime('%Y-%m-%dT%H:%M:%S')
        
        response = requests.get(
            f"{BASE_URL}/api/sessions/calendar/",
            headers=headers,
            params={
                'from': date_from,
                'to': date_to
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            sessions = data.get('results', [])
            
            print_success(f"Found {len(sessions)} calendar sessions")
            
            if sessions:
                print("\n📅 Calendar Sessions:")
                for session in sessions[:5]:
                    print(f"\n  • {session['topic']}")
                    print(f"    Date: {session['date_time']}")
                    print(f"    Trainer: {session.get('trainer_name', 'TBA')}")
                    print(f"    Trainer Dept: {session.get('trainer_department', 'N/A')}")
                    print(f"    Session Dept: {session.get('session_department', 'N/A')}")
                    print(f"    Type: {session['type']}")
                    print(f"    Venue: {session.get('venue', session.get('site', 'TBD'))}")
            else:
                print_info("No upcoming sessions in calendar")
        else:
            print_error(f"Failed to fetch calendar sessions: {response.status_code}")
            print(response.text)
    except Exception as e:
        print_error(f"Test failed: {str(e)}")

def test_dashboard_recent_training(token):
    """Test recent training section in dashboard"""
    print_header("TEST 2: Dashboard Recent Training Section")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Get dashboard
        response = requests.get(f"{BASE_URL}/api/trainee/dashboard/", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check recent_training section
            recent_training = data.get('recent_training', [])
            
            if recent_training:
                print_success(f"Found {len(recent_training)} recent training courses")
                
                print("\n📚 Recent Training:")
                for course in recent_training:
                    print(f"\n  • {course['title']}")
                    print(f"    Course ID: {course['course_id']}")
                    print(f"    Progress: {course['progress']}%")
                    print(f"    Status: {course['status']}")
                    print(f"    Last Accessed: {course['last_accessed']}")
                    print(f"    Description: {course['description']}")
                    print(f"    🔗 Link: /courses/{course['id']}")
            else:
                print_info("No recent training found")
            
            # Also check my_training section
            my_training = data.get('my_training', [])
            print_success(f"\nFound {len(my_training)} courses in 'My Training'")
            
            # Check upcoming sessions
            upcoming = data.get('upcoming_sessions', [])
            print_success(f"Found {len(upcoming)} upcoming sessions")
            
            # Check pending assessments
            pending = data.get('pending_assessments', [])
            print_success(f"Found {len(pending)} pending assessments")
            
        else:
            print_error(f"Failed to fetch dashboard: {response.status_code}")
            print(response.text)
    except Exception as e:
        print_error(f"Test failed: {str(e)}")

def main():
    print("\n" + "="*70)
    print("  TESTING FINAL FIXES")
    print("  1. Calendar sessions with department filtering")
    print("  2. Recent training section in dashboard")
    print("="*70)
    
    # Login
    print_info(f"Logging in as {USERNAME}...")
    token = get_auth_token(USERNAME, PASSWORD)
    
    if not token:
        print_error("Login failed")
        return
    
    print_success("Login successful")
    
    # Run tests
    test_calendar_sessions(token)
    test_dashboard_recent_training(token)
    
    print("\n" + "="*70)
    print("  TESTS COMPLETED")
    print("="*70 + "\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
