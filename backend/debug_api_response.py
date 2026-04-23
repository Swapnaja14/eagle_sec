"""
Debug script to check the actual API response format
Tests the dashboard API endpoint and shows the exact response structure
"""
import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

def debug_api_response():
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
            
            # Test dashboard overview endpoint
            print("\n" + "="*60)
            print("DEBUG: Dashboard API Response Structure")
            print("="*60)
            
            overview_response = requests.get(f"{base_url}/api/dashboard/overview/", headers=headers)
            
            if overview_response.status_code == 200:
                data = overview_response.json()
                
                print("Full API Response:")
                print(json.dumps(data, indent=2))
                
                print("\n" + "="*60)
                print("Frontend vs Backend Analysis")
                print("="*60)
                
                # Check what frontend expects vs what backend provides
                cards = data.get('cards', {})
                print(f"\nCards structure:")
                print(f"  Type: {type(cards)}")
                print(f"  Keys: {list(cards.keys()) if isinstance(cards, dict) else 'Not a dict'}")
                
                if isinstance(cards, dict):
                    for key in ['total_trained', 'avg_score', 'compliance_rate', 'pending_certifications']:
                        metric = cards.get(key, {})
                        print(f"\n  {key}:")
                        print(f"    Type: {type(metric)}")
                        print(f"    Keys: {list(metric.keys()) if isinstance(metric, dict) else 'Not a dict'}")
                        if isinstance(metric, dict):
                            print(f"    value: {metric.get('value', 'MISSING')} (type: {type(metric.get('value'))})")
                            print(f"    delta: {metric.get('delta', 'MISSING')} (type: {type(metric.get('delta'))})")
                            print(f"    trend_up: {metric.get('trend_up', 'MISSING')} (type: {type(metric.get('trend_up'))})")
                
                # Check other data sections
                print(f"\nOther data sections:")
                print(f"  department_completion: {len(data.get('department_completion', []))} items")
                print(f"  monthly_trend: {len(data.get('monthly_trend', []))} items")
                print(f"  upcoming_sessions: {len(data.get('upcoming_sessions', []))} items")
                print(f"  compliance_alerts: {len(data.get('compliance_alerts', []))} items")
                print(f"  recent_history: {len(data.get('recent_history', []))} items")
                
            else:
                print(f"Error accessing dashboard API: {overview_response.status_code}")
                print(f"Response: {overview_response.text}")
                
        else:
            print(f"Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to the Django server.")
        print("Make sure the server is running with: python manage.py runserver")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    debug_api_response()
