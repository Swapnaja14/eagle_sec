"""
Test script for the trainee courses API endpoint.
Run this after starting the Django server to verify the endpoint works correctly.

Usage:
    python test_trainee_courses_api.py
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api"
TEST_TRAINEE_USERNAME = "trainee"
TEST_TRAINEE_PASSWORD = "trainee123"


def test_trainee_courses_endpoint():
    """Test the trainee courses endpoint"""
    
    print("=" * 60)
    print("Testing Trainee Courses API Endpoint")
    print("=" * 60)
    
    # Step 1: Login as trainee
    print("\n1. Logging in as trainee...")
    login_url = f"{BASE_URL}/auth/login/"
    login_data = {
        "username": TEST_TRAINEE_USERNAME,
        "password": TEST_TRAINEE_PASSWORD
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        response.raise_for_status()
        tokens = response.json()
        access_token = tokens.get('access')
        print(f"✓ Login successful! Access token obtained.")
    except requests.exceptions.RequestException as e:
        print(f"✗ Login failed: {e}")
        return
    
    # Step 2: Fetch trainee courses
    print("\n2. Fetching trainee courses...")
    courses_url = f"{BASE_URL}/courses/trainee-courses/"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(courses_url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        print(f"✓ Successfully fetched courses!")
        print(f"\nTotal courses: {data.get('count', 0)}")
        
        # Display course details
        courses = data.get('courses', [])
        if courses:
            print("\n" + "=" * 60)
            print("Course Details:")
            print("=" * 60)
            
            for idx, course in enumerate(courses, 1):
                print(f"\n{idx}. {course.get('display_name')}")
                print(f"   Course ID: {course.get('course_id')}")
                print(f"   Department: {course.get('department')}")
                print(f"   Status: {course.get('status')}")
                print(f"   Total Videos: {course.get('total_videos', 0)}")
                print(f"   Total Documents: {course.get('total_documents', 0)}")
                print(f"   Total Files: {course.get('total_files', 0)}")
                print(f"   Has Pre-Assessment: {course.get('has_pre_assessment', False)}")
                print(f"   Has Post-Assessment: {course.get('has_post_assessment', False)}")
                
                # Display lessons
                lessons = course.get('lessons', [])
                print(f"   Lessons: {len(lessons)}")
                
                for lesson in lessons:
                    print(f"      - {lesson.get('title')} ({lesson.get('file_count', 0)} files)")
                    
                    # Display files
                    files = lesson.get('files', [])
                    for file in files:
                        file_type = file.get('file_type', 'unknown')
                        filename = file.get('original_filename', 'unknown')
                        print(f"         • [{file_type}] {filename}")
        else:
            print("\nNo courses found for this trainee.")
            print("This could mean:")
            print("  - No active courses in the trainee's department")
            print("  - No active courses in the trainee's tenant")
            print("  - The trainee hasn't been assigned to any courses")
        
        print("\n" + "=" * 60)
        print("Test completed successfully!")
        print("=" * 60)
        
        # Save response to file for inspection
        with open('trainee_courses_response.json', 'w') as f:
            json.dump(data, f, indent=2)
        print("\n✓ Full response saved to 'trainee_courses_response.json'")
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Failed to fetch courses: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")


if __name__ == "__main__":
    test_trainee_courses_endpoint()
