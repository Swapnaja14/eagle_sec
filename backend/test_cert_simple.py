"""
Simple test to verify certificate generation after quiz completion
"""
import requests
import json

BASE_URL = "http://localhost:8000"
USERNAME = "amit_210"
PASSWORD = "Pass@123"

def main():
    print("\n" + "="*70)
    print("CERTIFICATE GENERATION TEST")
    print("="*70)
    
    # 1. Login
    print("\n1. Logging in...")
    response = requests.post(
        f"{BASE_URL}/api/auth/login/",
        json={"username": USERNAME, "password": PASSWORD}
    )
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return
    
    token = response.json()['access']
    print("✅ Login successful")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # 2. Get available quizzes
    print("\n2. Fetching quizzes...")
    response = requests.get(f"{BASE_URL}/api/assessments/quizzes/", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch quizzes: {response.status_code}")
        print(response.text)
        return
    
    data = response.json()
    quizzes = data if isinstance(data, list) else data.get('results', [])
    
    if not quizzes:
        print("❌ No quizzes available")
        return
    
    print(f"✅ Found {len(quizzes)} quiz(es)")
    
    # Use first quiz
    quiz = quizzes[0]
    print(f"\n   Quiz: {quiz['title']}")
    print(f"   ID: {quiz['id']}")
    print(f"   Course: {quiz.get('course', 'NOT LINKED')}")
    print(f"   Passing Score: {quiz.get('passing_score', 70)}%")
    
    if not quiz.get('course'):
        print("\n⚠️  WARNING: Quiz not linked to course - certificate won't generate")
        return
    
    # 3. Start quiz
    print("\n3. Starting quiz...")
    response = requests.post(
        f"{BASE_URL}/api/assessments/quizzes/{quiz['id']}/start_quiz/",
        headers=headers
    )
    
    if response.status_code != 201:
        print(f"❌ Failed to start quiz: {response.status_code}")
        print(response.text)
        return
    
    submission = response.json()
    submission_id = submission['id']
    print(f"✅ Quiz started - Submission ID: {submission_id}")
    
    # 4. Get questions
    print("\n4. Fetching questions...")
    response = requests.get(
        f"{BASE_URL}/api/assessments/quizzes/{quiz['id']}/questions/",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to get questions: {response.status_code}")
        return
    
    questions = response.json()
    print(f"✅ Found {len(questions)} question(s)")
    
    if not questions:
        print("❌ No questions in quiz")
        return
    
    # 5. Answer all questions correctly
    print("\n5. Answering questions...")
    for idx, q in enumerate(questions, 1):
        question = q['question']
        correct_answer = question['correct_answer']
        
        print(f"   Question {idx}: {question['text'][:50]}...")
        print(f"   Correct answer: {correct_answer}")
        
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
                print(f"   ✅ Correct! Points: {result['points_earned']}")
            else:
                print(f"   ❌ Wrong!")
        else:
            print(f"   ❌ Failed to submit: {response.status_code}")
    
    # 6. Complete submission
    print("\n6. Completing submission...")
    response = requests.post(
        f"{BASE_URL}/api/assessments/submissions/{submission_id}/complete_submission/",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to complete: {response.status_code}")
        print(response.text)
        return
    
    result = response.json()
    
    print("\n" + "="*70)
    print("RESULTS")
    print("="*70)
    print(f"Score: {result.get('score', 0)}/{result.get('total_points', 0)}")
    print(f"Percentage: {result.get('percentage', 0):.1f}%")
    print(f"Passed: {result.get('passed', False)}")
    print(f"Status: {result.get('status', 'unknown')}")
    
    # Check certificate
    print("\n" + "="*70)
    print("CERTIFICATE STATUS")
    print("="*70)
    
    cert_generated = result.get('certificate_generated', False)
    cert_id = result.get('certificate_id')
    
    if cert_generated:
        print("✅ CERTIFICATE GENERATED!")
        print(f"   Certificate ID: {cert_id}")
        print(f"   Download URL: {BASE_URL}/api/certificates/{cert_id}/download/")
        
        # Verify certificate
        response = requests.get(
            f"{BASE_URL}/api/certificates/{cert_id}/",
            headers=headers
        )
        
        if response.status_code == 200:
            cert_data = response.json()
            print(f"   Issued At: {cert_data.get('issued_at')}")
            print(f"   Course: {cert_data.get('course', {}).get('display_name')}")
            print("   ✅ Certificate verified")
        else:
            print("   ⚠️  Certificate not accessible")
    else:
        print("❌ CERTIFICATE NOT GENERATED")
        if result.get('passed'):
            print("   Quiz was passed but certificate not created")
            print("   Possible issues:")
            print("   - Quiz not linked to course")
            print("   - Certificate generation error (check server logs)")
        else:
            print(f"   Quiz not passed (need {quiz.get('passing_score', 70)}%)")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
