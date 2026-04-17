"""
Test script for dashboard API endpoints
Tests the dashboard with the sample data created by seed_dashboard_data.py
"""
import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

def test_dashboard_api():
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
            print("\n" + "="*50)
            print("Testing Dashboard Overview API")
            print("="*50)
            
            overview_response = requests.get(f"{base_url}/api/dashboard/overview/", headers=headers)
            
            if overview_response.status_code == 200:
                data = overview_response.json()
                
                print("Dashboard Overview Data:")
                print(f"  Cards: {len(data.get('cards', {}))} metrics")
                
                # Display card metrics
                cards = data.get('cards', {})
                print(f"\n  Key Metrics:")
                print(f"    Total Trained: {cards.get('total_trained', {}).get('value', 0)}")
                print(f"    Avg Score: {cards.get('avg_score', {}).get('value', 0)}%")
                print(f"    Compliance Rate: {cards.get('compliance_rate', {}).get('value', 0)}%")
                print(f"    Pending Certifications: {cards.get('pending_certifications', {}).get('value', 0)}")
                
                print(f"\n  Department Completion: {len(data.get('department_completion', []))} departments")
                for dept in data.get('department_completion', [])[:3]:  # Show first 3
                    print(f"    {dept['department']}: {dept['actual_percent']}% (target: {dept['target_percent']}%)")
                
                print(f"\n  Monthly Trend: {len(data.get('monthly_trend', []))} months")
                for month in data.get('monthly_trend', [])[:3]:  # Show first 3
                    print(f"    {month['month']}: {month['enrolled']} enrolled, {month['completed']} completed")
                
                print(f"\n  Upcoming Sessions: {len(data.get('upcoming_sessions', []))}")
                for session in data.get('upcoming_sessions', [])[:3]:  # Show first 3
                    print(f"    {session['topic']} - {session['date_time']}")
                
                print(f"\n  Compliance Alerts: {len(data.get('compliance_alerts', []))}")
                for alert in data.get('compliance_alerts', [])[:3]:  # Show first 3
                    print(f"    {alert['department']}: {alert['behind_percent']}% behind")
                
                print(f"\n  Recent History: {len(data.get('recent_history', []))}")
                for history in data.get('recent_history', [])[:3]:  # Show first 3
                    print(f"    {history['employee_name']} - {history['module_name']}: {history['score']}%")
                
                print("\n" + "="*50)
                print("Dashboard API Test Results")
                print("="*50)
                
                # Verify data is not empty
                issues = []
                
                if cards.get('total_trained', {}).get('value', 0) == 0:
                    issues.append("Total trained is 0")
                if cards.get('avg_score', {}).get('value', 0) == 0:
                    issues.append("Average score is 0")
                if cards.get('compliance_rate', {}).get('value', 0) == 0:
                    issues.append("Compliance rate is 0")
                if len(data.get('department_completion', [])) == 0:
                    issues.append("No department completion data")
                if len(data.get('monthly_trend', [])) == 0:
                    issues.append("No monthly trend data")
                if len(data.get('upcoming_sessions', [])) == 0:
                    issues.append("No upcoming sessions")
                if len(data.get('compliance_alerts', [])) == 0:
                    issues.append("No compliance alerts")
                if len(data.get('recent_history', [])) == 0:
                    issues.append("No recent history")
                
                if issues:
                    print("Issues found:")
                    for issue in issues:
                        print(f"  - {issue}")
                else:
                    print("All dashboard metrics populated successfully!")
                    print("The dashboard should now display meaningful data instead of zeros.")
                
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
    test_dashboard_api()
