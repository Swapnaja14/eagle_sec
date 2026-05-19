"""
Final Integration Test Script
Tests all features with actual credentials
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# Credentials
TRAINER_USERNAME = "vaishu_210"
TRAINER_PASSWORD = "Pass@123"
TRAINEE_USERNAME = "amit_210"
TRAINEE_PASSWORD = "Pass@123"

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
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login/",
            json={"username": username, "password": password}
        )
        if response.status_code == 200:
            return response.json()['access']
        else:
            print_error(f"Login failed for {username}: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print_error(f"Login error: {str(e)}")
        return None

def test_countdown_timer(token):
    """Test 1: Quiz Countdown Timer"""
    print_header("TEST 1: Quiz Countdown Timer")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Get available quizzes
        response = requests.get(f"{BASE_URL}/api/assessments/quizzes/", headers=headers)
        if response.status_code == 200 and response.json():
            quizzes = response.json()
            print_success(f"Found {len(quizzes)} quizzes")
            
            if quizzes:
                quiz = quizzes[0]
                print_info(f"Testing with quiz: {quiz['title']}")
                
                # Start quiz
                response = requests.post(
                    f"{BASE_URL}/api/assessments/quizzes/{quiz['id']}/start_quiz/",
                    headers=headers
                )
                
                if response.status_code == 201:
                    data = response.json()
                    print_success("Quiz started successfully")
                    print_info(f"  Submission ID: {data['id']}")
                    
                    if 'quiz_info' in data:
                        quiz_info = data['quiz_info']
                        print_success("Quiz timer information available:")
                        print(f"    Time Limit: {quiz_info.get('time_limit_minutes')} minutes")
                        print(f"    Deadline: {quiz_info.get('deadline')}")
                        
                        # Test active submission endpoint
                        response = requests.get(
                            f"{BASE_URL}/api/assessments/submissions/active_submission/",
                            headers=headers
                        )
                        
                        if response.status_code == 200:
                            active = response.json()
                            print_success("Active submission endpoint working:")
                            print(f"    Time Remaining: {active.get('time_remaining_seconds')} seconds")
                            print(f"    Deadline: {active.get('deadline')}")
                        else:
                            print_error("Active submission endpoint failed")
                    else:
                        print_error("No quiz_info in response")
                else:
                    print_error(f"Failed to start quiz: {response.status_code}")
                    if response.status_code == 400:
                        print_info(f"  {response.json().get('error', 'Unknown error')}")
        else:
            print_error("No quizzes available")
    except Exception as e:
        print_error(f"Test failed: {str(e)}")

def test_dashboard_courses(token):
    """Test 2: Dashboard Courses"""
    print_header("TEST 2: Dashboard Courses")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Get dashboard
        response = requests.get(
            f"{BASE_URL}/api/trainee/dashboard/",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Dashboard loaded successfully")
            
            my_training = data.get('my_training', [])
            print_info(f"Total courses: {len(my_training)}")
            
            if my_training:
                print_success("Courses found:")
                for course in my_training[:5]:  # Show first 5
                    print(f"    • {course['module']}")
                    print(f"      Status: {course['status']}")
                    if course.get('score'):
                        print(f"      Score: {course['score']}%")
                    if course.get('certificateReady'):
                        print(f"      Certificate: Ready (ID: {course['certificate_id']})")
            else:
                print_error("No courses in dashboard")
                print_info("This might be because:")
                print_info("  1. No courses assigned to trainee")
                print_info("  2. No courses from trainers in same department")
                
            # Check upcoming sessions
            sessions = data.get('upcoming_sessions', [])
            print_info(f"Upcoming sessions: {len(sessions)}")
            if sessions:
                print_success("Sessions found:")
                for session in sessions[:3]:
                    print(f"    • {session['module']}")
                    print(f"      Date: {session['date']}")
                    print(f"      Trainer: {session.get('trainer', 'TBA')}")
                    print(f"      Type: {session['type']}")
        else:
            print_error(f"Dashboard failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print_error(f"Test failed: {str(e)}")

def test_trainee_courses_api(token):
    """Test 3: Trainee Courses API with Enrolled Count"""
    print_header("TEST 3: Trainee Courses API")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/courses/trainee/my-courses/",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Trainee courses API working")
            
            trainee = data.get('trainee', {})
            print_info(f"Trainee: {trainee.get('full_name')} ({trainee.get('username')})")
            print_info(f"Department: {trainee.get('department')}")
            print_info(f"Company: {trainee.get('company')}")
            
            courses = data.get('courses', [])
            print_info(f"Total courses: {len(courses)}")
            
            if courses:
                print_success("Course details:")
                for course in courses[:3]:
                    print(f"\n    📚 {course['title']}")
                    print(f"       Enrolled: {course.get('enrolled_count', 0)} trainees")
                    print(f"       Lessons: {course['lesson_count']}")
                    print(f"       Videos: {course['total_videos']}")
                    print(f"       Documents: {course['total_documents']}")
                    
                    if course.get('trainer'):
                        trainer = course['trainer']
                        print(f"       Trainer: {trainer['name']} ({trainer['department']})")
                    
                    if course.get('certificate'):
                        print(f"       ✅ Certificate available")
                    elif course.get('can_generate_certificate'):
                        print(f"       🎓 Can generate certificate")
        else:
            print_error(f"API failed: {response.status_code}")
    except Exception as e:
        print_error(f"Test failed: {str(e)}")

def test_certificate_generation(token):
    """Test 4: Certificate Generation"""
    print_header("TEST 4: Certificate Generation")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Get courses
        response = requests.get(
            f"{BASE_URL}/api/courses/trainee/my-courses/",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            courses = data.get('courses', [])
            
            # Find a completed course
            completed_course = None
            for course in courses:
                if course.get('assignment_status') == 'completed':
                    completed_course = course
                    break
            
            if completed_course:
                print_success(f"Found completed course: {completed_course['title']}")
                course_id = completed_course['id']
                
                # Try to generate certificate
                response = requests.post(
                    f"{BASE_URL}/api/certificates/auto-generate/",
                    headers=headers,
                    json={"course_id": course_id}
                )
                
                if response.status_code in [200, 201]:
                    cert_data = response.json()
                    print_success("Certificate generated/retrieved successfully")
                    print_info(f"  Certificate ID: {cert_data['id']}")
                    print_info(f"  Issued At: {cert_data['issued_at']}")
                    print_info(f"  Download URL: {cert_data.get('download_url', 'N/A')}")
                    
                    if response.status_code == 200:
                        print_info("  (Certificate already existed)")
                    else:
                        print_info("  (New certificate created)")
                else:
                    print_error(f"Failed to generate certificate: {response.status_code}")
                    error_data = response.json()
                    print_info(f"  Reason: {error_data.get('detail', 'Unknown')}")
            else:
                print_error("No completed courses found")
                print_info("To test certificate generation:")
                print_info("  1. Complete a course")
                print_info("  2. Mark assignment as 'completed'")
                print_info("  3. Run this test again")
        else:
            print_error(f"Failed to get courses: {response.status_code}")
    except Exception as e:
        print_error(f"Test failed: {str(e)}")

def test_user_info(token, username):
    """Get user information"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f"{BASE_URL}/api/auth/me/", headers=headers)
        if response.status_code == 200:
            user = response.json()
            print_info(f"User: {user.get('username')}")
            print_info(f"Role: {user.get('role')}")
            print_info(f"Department: {user.get('department', 'Not set')}")
            print_info(f"Tenant: {user.get('tenant', {}).get('name', 'Not set')}")
            return user
        else:
            print_error("Failed to get user info")
            return None
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

def main():
    print("\n" + "="*70)
    print("  FINAL INTEGRATION TEST")
    print("  Testing all features with actual credentials")
    print("="*70)
    
    # Test Trainee
    print_header("TRAINEE TESTS")
    print_info(f"Username: {TRAINEE_USERNAME}")
    
    trainee_token = get_auth_token(TRAINEE_USERNAME, TRAINEE_PASSWORD)
    
    if trainee_token:
        print_success("Trainee login successful")
        
        # Get user info
        user_info = test_user_info(trainee_token, TRAINEE_USERNAME)
        
        # Run tests
        test_countdown_timer(trainee_token)
        test_dashboard_courses(trainee_token)
        test_trainee_courses_api(trainee_token)
        test_certificate_generation(trainee_token)
    else:
        print_error("Trainee login failed - cannot proceed with tests")
    
    # Test Trainer (optional)
    print_header("TRAINER TESTS (Optional)")
    print_info(f"Username: {TRAINER_USERNAME}")
    
    trainer_token = get_auth_token(TRAINER_USERNAME, TRAINER_PASSWORD)
    
    if trainer_token:
        print_success("Trainer login successful")
        user_info = test_user_info(trainer_token, TRAINER_USERNAME)
    else:
        print_error("Trainer login failed")
    
    # Summary
    print_header("TEST SUMMARY")
    print_success("Integration tests completed!")
    print_info("\nNext steps:")
    print_info("  1. Check the results above")
    print_info("  2. Fix any failed tests")
    print_info("  3. Integrate with frontend")
    print_info("  4. Test in mobile app")
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
