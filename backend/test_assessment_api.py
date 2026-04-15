import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from accounts.models import User

# Test API endpoints
BASE_URL = 'http://localhost:8000'

def test_endpoints():
    # Get admin user
    admin = User.objects.filter(username='admin').first()
    if not admin:
        print("❌ Admin user not found")
        return
    
    # Login to get token
    print("Testing API Endpoints...")
    print("=" * 60)
    
    try:
        # Test login
        response = requests.post(f'{BASE_URL}/api/auth/login/', json={
            'username': 'admin',
            'password': 'admin123'
        })
        
        if response.status_code == 200:
            token = response.json().get('access')
            print("✓ Login successful")
            
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test quizzes list
            response = requests.get(f'{BASE_URL}/api/assessments/quizzes/', headers=headers)
            if response.status_code == 200:
                quizzes = response.json()
                count = len(quizzes) if isinstance(quizzes, list) else quizzes.get('count', 0)
                print(f"✓ Quizzes endpoint working - {count} quizzes found")
            else:
                print(f"❌ Quizzes endpoint failed: {response.status_code}")
            
            # Test trainers endpoint
            response = requests.get(f'{BASE_URL}/api/assessments/quizzes/trainers/', headers=headers)
            if response.status_code == 200:
                trainers = response.json()
                print(f"✓ Trainers endpoint working - {len(trainers)} trainers found")
            else:
                print(f"❌ Trainers endpoint failed: {response.status_code}")
            
            # Test questions endpoint
            response = requests.get(f'{BASE_URL}/api/questions/', headers=headers)
            if response.status_code == 200:
                questions = response.json()
                count = len(questions) if isinstance(questions, list) else questions.get('count', 0)
                print(f"✓ Questions endpoint working - {count} questions found")
            else:
                print(f"❌ Questions endpoint failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
            
            # Test courses endpoint
            response = requests.get(f'{BASE_URL}/api/courses/', headers=headers)
            if response.status_code == 200:
                courses = response.json()
                count = len(courses) if isinstance(courses, list) else courses.get('count', 0)
                print(f"✓ Courses endpoint working - {count} courses found")
            else:
                print(f"❌ Courses endpoint failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        print("   Make sure the server is running: python manage.py runserver")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("=" * 60)

if __name__ == '__main__':
    test_endpoints()
