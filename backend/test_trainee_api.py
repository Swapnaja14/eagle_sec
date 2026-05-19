"""
Test script for trainee courses API endpoint
Run this after starting the Django server
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def get_auth_token(username, password):
    """Get JWT token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login/",
        json={"username": username, "password": password}
    )
    if response.status_code == 200:
        return response.json()['access']
    else:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None

def test_trainee_courses(token):
    """Test the trainee courses endpoint"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(
        f"{BASE_URL}/api/courses/trainee/my-courses/",
        headers=headers
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"\nResponse:")
    print(json.dumps(response.json(), indent=2))
    
    return response.json()

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Trainee Courses API with Department Filtering")
    print("=" * 60)
    
    # Login as trainee
    print("\n1. Logging in as trainee...")
    token = get_auth_token("trainee", "trainee123")
    
    if token:
        print("✓ Login successful")
        
        # Test the endpoint
        print("\n2. Fetching trainee courses...")
        data = test_trainee_courses(token)
        
        if data:
            trainee = data.get('trainee', {})
            print(f"\n✓ Trainee: {trainee.get('full_name')}")
            print(f"✓ Company: {trainee.get('company')}")
            print(f"✓ Department: {trainee.get('department')}")
            print(f"✓ Found {data.get('total_courses', 0)} courses")
            
            for course in data.get('courses', []):
                print(f"\n  Course: {course['title']}")
                
                # Trainer info
                trainer = course.get('trainer')
                if trainer:
                    print(f"    Trainer: {trainer['name']} ({trainer['department']})")
                
                print(f"    - Lessons: {course['lesson_count']}")
                print(f"    - Total Videos: {course['total_videos']}")
                print(f"    - Total Documents: {course['total_documents']}")
                print(f"    - Status: {course['assignment_status']}")
                
                # Show lesson details
                for lesson in course.get('lessons', []):
                    print(f"\n      Lesson {lesson['order']}: {lesson['title']}")
                    print(f"        Videos: {lesson['video_count']}")
                    for video in lesson.get('videos', []):
                        print(f"          - {video['filename']}")
                    print(f"        Documents: {lesson['document_count']}")
                    for doc in lesson.get('documents', []):
                        print(f"          - {doc['filename']}")
    else:
        print("✗ Login failed")
    
    print("\n" + "=" * 60)
