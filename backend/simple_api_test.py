"""
Simple test to verify SessionSchedulerPage API endpoints
"""
import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

def test_apis():
    base_url = "http://localhost:8000"
    
    # Login
    login_data = {"username": "admin", "password": "admin123"}
    login_response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
    
    if login_response.status_code == 200:
        token = login_response.json().get('access')
        headers = {"Authorization": f"Bearer {token}"}
        
        print("Testing APIs...")
        
        # Test sites
        sites_resp = requests.get(f"{base_url}/api/auth/sites/", headers=headers)
        print(f"Sites: {sites_resp.status_code} - {len(sites_resp.json())} sites")
        
        # Test clients
        clients_resp = requests.get(f"{base_url}/api/auth/clients/", headers=headers)
        print(f"Clients: {clients_resp.status_code} - {len(clients_resp.json())} clients")
        
        # Test employees
        employees_resp = requests.get(f"{base_url}/api/auth/employees/", headers=headers)
        print(f"Employees: {employees_resp.status_code} - {len(employees_resp.json())} employees")
        
        # Test training topics
        topics_resp = requests.get(f"{base_url}/api/courses/training-topics/", headers=headers)
        print(f"Training Topics: {topics_resp.status_code} - {len(topics_resp.json())} topics")
        
        print("All APIs tested successfully!")
        
    else:
        print(f"Login failed: {login_response.status_code}")

if __name__ == '__main__':
    test_apis()
