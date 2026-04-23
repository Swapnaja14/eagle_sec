"""
Test script to verify all SessionSchedulerPage API endpoints are working
Tests sites, clients, employees, and training topics endpoints
"""
import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

def test_session_scheduler_apis():
    base_url = "http://localhost:8000"
    
    # Login as admin user
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        # Get authentication token
        login_response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data.get('access')
            headers = {"Authorization": f"Bearer {token}"}
            
            print("Successfully authenticated as admin")
            print("\n" + "="*60)
            print("Testing SessionSchedulerPage API Endpoints")
            print("="*60)
            
            # Test sites endpoint
            print("\n1. Testing Sites API:")
            sites_response = requests.get(f"{base_url}/api/auth/sites/", headers=headers)
            if sites_response.status_code == 200:
                sites = sites_response.json()
                print(f"   Found {len(sites)} sites")
                for site in sites[:3]:  # Show first 3
                    print(f"   - {site['name']} ({site.get('city', 'N/A')})")
            else:
                print(f"   Error: {sites_response.status_code}")
            
            # Test clients endpoint
            print("\n2. Testing Clients API:")
            clients_response = requests.get(f"{base_url}/api/auth/clients/", headers=headers)
            if clients_response.status_code == 200:
                clients = clients_response.json()
                print(f"   Found {len(clients)} clients")
                for client in clients[:3]:  # Show first 3
                    print(f"   - {client['name']} ({client.get('industry', 'N/A')})")
            else:
                print(f"   Error: {clients_response.status_code}")
            
            # Test employees endpoint
            print("\n3. Testing Employees API:")
            employees_response = requests.get(f"{base_url}/api/auth/employees/", headers=headers)
            if employees_response.status_code == 200:
                employees = employees_response.json()
                print(f"   Found {len(employees)} employees")
                for emp in employees[:3]:  # Show first 3
                    print(f"   - {emp['name']} ({emp.get('department', 'N/A')})")
            else:
                print(f"   Error: {employees_response.status_code}")
            
            # Test training topics endpoint
            print("\n4. Testing Training Topics API:")
            topics_response = requests.get(f"{base_url}/api/courses/training-topics/", headers=headers)
            if topics_response.status_code == 200:
                topics = topics_response.json()
                print(f"   Found {len(topics)} training topics")
                for topic in topics[:5]:  # Show first 5
                    print(f"   - {topic}")
            else:
                print(f"   Error: {topics_response.status_code}")
            
            # Test trainers endpoint (existing)
            print("\n5. Testing Trainers API:")
            trainers_response = requests.get(f"{base_url}/api/sessions/trainers/", headers=headers)
            if trainers_response.status_code == 200:
                trainers = trainers_response.json()
                print(f"   Found {len(trainers)} trainers")
                for trainer in trainers[:3]:  # Show first 3
                    print(f"   - {trainer.get('name', trainer.get('username', 'N/A'))}")
            else:
                print(f"   Error: {trainers_response.status_code}")
            
            print("\n" + "="*60)
            print("API Test Summary")
            print("="*60)
            
            # Summary
            endpoints_tested = [
                ("Sites", sites_response.status_code == 200),
                ("Clients", clients_response.status_code == 200),
                ("Employees", employees_response.status_code == 200),
                ("Training Topics", topics_response.status_code == 200),
                ("Trainers", trainers_response.status_code == 200),
            ]
            
            all_working = True
            for endpoint_name, working in endpoints_tested:
                status = "Working" if working else "Failed"
                print(f"   {endpoint_name}: {status}")
                if not working:
                    all_working = False
            
            if all_working:
                print(f"\nSUCCESS: All SessionSchedulerPage APIs are working!")
                print("The frontend should now display real data instead of mock data.")
            else:
                print(f"\nISSUE: Some APIs are not working. Check the logs above.")
            
        else:
            print(f"Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to the Django server.")
        print("Make sure the server is running with: python manage.py runserver")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_session_scheduler_apis()
