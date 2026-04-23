"""
Test training topics endpoint specifically
"""
import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

def test_training_topics():
    base_url = "http://localhost:8000"
    
    # Login
    login_data = {"username": "admin", "password": "admin123"}
    login_response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
    
    if login_response.status_code == 200:
        token = login_response.json().get('access')
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test training topics endpoint
        topics_resp = requests.get(f"{base_url}/api/courses/training-topics/", headers=headers)
        print(f"Training Topics Status: {topics_resp.status_code}")
        print(f"Response: {topics_resp.text}")
        
        if topics_resp.status_code == 200:
            print(f"Found {len(topics_resp.json())} topics:")
            for topic in topics_resp.json()[:5]:
                print(f"  - {topic}")
        
    else:
        print(f"Login failed: {login_response.status_code}")

if __name__ == '__main__':
    test_training_topics()
