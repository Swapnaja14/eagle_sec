"""
Test script for certificate generation and upcoming sessions fixes
"""
import requests
import json

BASE_URL = "http://localhost:8000"
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
    response = requests.post(
        f"{BASE_URL}/api/auth/login/",
        json={"username": username, "password": password}
    )
    if response.status_code == 200:
        return response.json()['access']
    return None

def test_certificate_auto_generation(token):
    """Test automatic certificate generation after quiz completion"""
    print_header("TEST: Auto-Generate Certificate After Quiz")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Get quizzes
        response = requests.get(f"{BASE_URL}/api/assessments/quizzes/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            
            # Handle both list and paginated response
            if isinstance(data, dict):
                quizzes = data.get('results', [])
            else:
                quizzes = data
            
            if not quizzes:
                print_error("No quizzes available")
                return
            
            quiz = quizzes[0]
            print_info(f"Testing with quiz: {quiz['title']}")
            print_info(f"Quiz ID: {quiz['id']}")
            
            # Check if quiz has a course
            if quiz.get('course'):
                print_success(f"Quiz linked to course ID: {quiz['course']}")
            else:
                print_error("Quiz not linked to any course - certificate won't be generated")
                print_info("To fix: Link quiz to a course in admin panel")
                return
            
            # Check if already attempted
            response = requests.get(
                f"{BASE_URL}/api/assessments/submissions/my_submissions/",
                headers=headers
            )
            
            if response.status_code == 200:
                submissions = response.json()
                existing = [s for s in submissions if s.get('quiz', {}).get('id') == quiz['id']]
                if existing:
                    print_info(f"Quiz already attempted {len(existing)} time(s)")
                    if quiz.get('max_attempts', 0) > 0 and len(existing) >= quiz['max_attempts']:
                        print_error(f"Max attempts ({quiz['max_attempts']}) reached")
                        return
            
            # Start quiz
            print_info("Starting quiz...")
            response = requests.post(
                f"{BASE_URL}/api/assessments/quizzes/{quiz['id']}/start_quiz/",
                headers=headers
            )
            
            if response.status_code != 201:
                print_error(f"Failed to start quiz: {response.status_code}")
                error_data = response.json()
                print_info(f"  Error: {error_data.get('error', 'Unknown error')}")
                return
            
            submission = response.json()
            submission_id = submission['id']
            print_success(f"Quiz started - Submission ID: {submission_id}")
            
            # Get questions
            response = requests.get(
                f"{BASE_URL}/api/assessments/quizzes/{quiz['id']}/questions/",
                headers=headers
            )
            
            if response.status_code != 200:
                print_error("Failed to get questions")
                return
            
            questions = response.json()
            
            if not questions:
                print_error("No questions in quiz")
                return
            
            print_info(f"Found {len(questions)} questions")
            
            # Answer all questions correctly
            for idx, q in enumerate(questions, 1):
                question = q['question']
                correct_answer = question['correct_answer']
                
                response = requests.post(
                    f"{BASE_URL}/api/assessments/submissions/{submission_id}/submit_answer/",
                    headers=headers,
                    json={
                        'question_id': question['id'],
                        'selected_answer': correct_answer
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result['is_correct']:
                        print_success(f"  Question {idx}: Correct ✓")
                    else:
                        print_error(f"  Question {idx}: Wrong ✗")
                else:
                    print_error(f"  Question {idx}: Failed to submit")
            
            # Complete submission
            print_info("Completing submission...")
            response = requests.post(
                f"{BASE_URL}/api/assessments/submissions/{submission_id}/complete_submission/",
                headers=headers
            )
            
            if response.status_code != 200:
                print_error(f"Failed to complete submission: {response.status_code}")
                print(response.text)
                return
            
            result = response.json()
            print_success("Submission completed!")
            print_info(f"  Score: {result.get('percentage', 0):.1f}%")
            print_info(f"  Passing Score: {quiz.get('passing_score', 70)}%")
            print_info(f"  Passed: {result.get('passed', False)}")
            
            # Check if certificate was generated
            if result.get('certificate_generated'):
                print_success("✨ Certificate auto-generated!")
                print_info(f"  Certificate ID: {result.get('certificate_id')}")
                
                # Get download URL
                cert_id = result.get('certificate_id')
                download_url = f"{BASE_URL}/api/certificates/{cert_id}/download/"
                print_info(f"  Download URL: {download_url}")
                
                # Verify certificate exists
                response = requests.get(
                    f"{BASE_URL}/api/certificates/{cert_id}/",
                    headers=headers
                )
                if response.status_code == 200:
                    print_success("Certificate verified and accessible")
                else:
                    print_error("Certificate not accessible")
            else:
                if result.get('passed'):
                    print_error("Quiz passed but certificate not generated")
                    print_info("Possible reasons:")
                    print_info("  - Quiz not linked to course")
                    print_info("  - Certificate generation failed (check server logs)")
                else:
                    print_info("Certificate not generated (quiz not passed)")
                    print_info(f"  Need {quiz.get('passing_score', 70)}% to pass")
        else:
            print_error("No quizzes available or failed to fetch")
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

def test_upcoming_sessions(token):
    """Test upcoming sessions from trainer"""
    print_header("TEST: Upcoming Sessions from Trainer")
    
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
        
        # Get dashboard
        response = requests.get(f"{BASE_URL}/api/trainee/dashboard/", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            sessions = data.get('upcoming_sessions', [])
            
            print_info(f"Found {len(sessions)} upcoming sessions")
            
            if sessions:
                print_success("Upcoming sessions:")
                for session in sessions:
                    print(f"\n  📅 {session['module']}")
                    print(f"     Date: {session['date']}")
                    print(f"     Trainer: {session.get('trainer', 'TBA')}")
                    print(f"     Trainer Dept: {session.get('trainer_department', 'N/A')}")
                    print(f"     Session Dept: {session.get('session_department', 'N/A')}")
                    print(f"     Type: {session['type']}")
                    print(f"     Venue: {session['venue']}")
            else:
                print_error("No upcoming sessions found")
                print_info("Possible reasons:")
                print_info("  1. No sessions scheduled")
                print_info("  2. Trainer department doesn't match trainee department")
                print_info("  3. Session department doesn't match trainee department")
                print_info("  4. All sessions are in the past")
                
                # Check all sessions (without date filter)
                print_info("\nChecking all training sessions...")
                from dashboard.models import TrainingSession
                all_sessions = TrainingSession.objects.filter(is_active=True)
                print_info(f"Total active sessions: {all_sessions.count()}")
                
                for session in all_sessions[:3]:
                    print(f"  - {session.topic}")
                    print(f"    Trainer: {session.trainer.username if session.trainer else 'None'}")
                    print(f"    Trainer Dept: {session.trainer.department if session.trainer else 'None'}")
                    print(f"    Session Dept: {session.department}")
                    print(f"    Date: {session.date_time}")
        else:
            print_error(f"Failed to get dashboard: {response.status_code}")
    except Exception as e:
        print_error(f"Test failed: {str(e)}")

def main():
    print("\n" + "="*70)
    print("  TESTING FIXES")
    print("  1. Certificate auto-generation after quiz")
    print("  2. Upcoming sessions from trainer")
    print("="*70)
    
    # Login
    print_info(f"Logging in as {TRAINEE_USERNAME}...")
    token = get_auth_token(TRAINEE_USERNAME, TRAINEE_PASSWORD)
    
    if not token:
        print_error("Login failed")
        return
    
    print_success("Login successful")
    
    # Run tests
    test_certificate_auto_generation(token)
    test_upcoming_sessions(token)
    
    print("\n" + "="*70)
    print("  TESTS COMPLETED")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
