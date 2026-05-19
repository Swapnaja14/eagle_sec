"""
Simple certificate generation test
"""
import requests

BASE_URL = "http://localhost:8000"

# Login
print("Logging in...")
response = requests.post(f"{BASE_URL}/api/auth/login/", json={
    "username": "amit_210",
    "password": "Pass@123"
})

if response.status_code != 200:
    print("Login failed!")
    exit(1)

token = response.json()['access']
print("✓ Logged in")

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Get quizzes
print("\nFetching quizzes...")
response = requests.get(f"{BASE_URL}/api/assessments/quizzes/", headers=headers)
print(f"Status: {response.status_code}")
print(f"Response type: {type(response.json())}")
print(f"Response: {response.json()}")

quizzes = response.json()
if isinstance(quizzes, list):
    print(f"✓ Found {len(quizzes)} quizzes (list)")
    if quizzes:
        quiz = quizzes[0]
else:
    print(f"✓ Response is dict with keys: {quizzes.keys()}")
    quiz = quizzes[0] if isinstance(quizzes, list) else None

if not quiz:
    print("No quiz found!")
    exit(1)

print(f"\nQuiz: {quiz.get('title')}")
print(f"Course: {quiz.get('course')}")
print(f"Questions: {quiz.get('total_questions', 0)}")

# Start quiz
print("\nStarting quiz...")
response = requests.post(
    f"{BASE_URL}/api/assessments/quizzes/{quiz['id']}/start_quiz/",
    headers=headers
)

if response.status_code != 201:
    print(f"Failed to start: {response.status_code}")
    print(response.json())
    exit(1)

submission = response.json()
print(f"✓ Started - Submission ID: {submission['id']}")

# Get questions
print("\nGetting questions...")
response = requests.get(
    f"{BASE_URL}/api/assessments/quizzes/{quiz['id']}/questions/",
    headers=headers
)

questions = response.json()
print(f"✓ Found {len(questions)} questions")

# Answer questions
print("\nAnswering questions...")
for q in questions:
    question = q['question']
    response = requests.post(
        f"{BASE_URL}/api/assessments/submissions/{submission['id']}/submit_answer/",
        headers=headers,
        json={
            'question_id': question['id'],
            'selected_answer': question['correct_answer']
        }
    )
    result = response.json()
    print(f"  Q{question['id']}: {'✓' if result['is_correct'] else '✗'}")

# Complete submission
print("\nCompleting submission...")
response = requests.post(
    f"{BASE_URL}/api/assessments/submissions/{submission['id']}/complete_submission/",
    headers=headers
)

if response.status_code != 200:
    print(f"Failed: {response.status_code}")
    print(response.text)
    exit(1)

result = response.json()
print(f"✓ Completed!")
print(f"  Score: {result['percentage']}%")
print(f"  Passed: {result['passed']}")
print(f"  Certificate Generated: {result.get('certificate_generated', False)}")
print(f"  Certificate ID: {result.get('certificate_id', 'None')}")

if result.get('certificate_generated'):
    print(f"\n✨ SUCCESS! Certificate generated!")
    print(f"Download: {BASE_URL}/api/certificates/{result['certificate_id']}/download/")
else:
    print(f"\n❌ Certificate NOT generated")
    if result['passed']:
        print("  Quiz passed but no certificate - check server logs")
    else:
        print(f"  Quiz not passed (need {quiz.get('passing_score', 70)}%)")
