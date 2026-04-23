"""
Test script to verify timezone fix for dashboard data
Tests that the dashboard now correctly shows data after fixing timezone handling
"""
import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from accounts.models import User
from dashboard.services import get_dashboard_overview, _parse_date_range

def test_timezone_fix():
    print("=" * 60)
    print("Testing Timezone Fix for Dashboard")
    print("=" * 60)
    
    # Get admin user
    admin_user = User.objects.filter(username='admin').first()
    if not admin_user:
        print("Admin user not found. Please run seed_dashboard_data.py first.")
        return
    
    print(f"Testing with user: {admin_user.username} ({admin_user.role})")
    
    # Test date range parsing
    params = {}
    start, end = _parse_date_range(params)
    print(f"\nDate range: {start} to {end}")
    print(f"Range duration: {end - start}")
    
    # Get dashboard overview
    print("\nTesting dashboard overview...")
    try:
        overview_data = get_dashboard_overview(admin_user, params)
        
        print("Dashboard Overview Results:")
        print(f"  Cards data: {len(overview_data.get('cards', {}))} metrics")
        
        cards = overview_data.get('cards', {})
        print(f"\n  Key Metrics:")
        print(f"    Total Trained: {cards.get('total_trained', {}).get('value', 0)}")
        print(f"    Avg Score: {cards.get('avg_score', {}).get('value', 0)}%")
        print(f"    Compliance Rate: {cards.get('compliance_rate', {}).get('value', 0)}%")
        print(f"    Pending Certifications: {cards.get('pending_certifications', {}).get('value', 0)}")
        
        print(f"\n  Department Completion: {len(overview_data.get('department_completion', []))} departments")
        print(f"  Monthly Trend: {len(overview_data.get('monthly_trend', []))} months")
        print(f"  Upcoming Sessions: {len(overview_data.get('upcoming_sessions', []))}")
        print(f"  Compliance Alerts: {len(overview_data.get('compliance_alerts', []))}")
        print(f"  Recent History: {len(overview_data.get('recent_history', []))}")
        
        # Check if data is populated
        issues = []
        
        if cards.get('total_trained', {}).get('value', 0) == 0:
            issues.append("Total trained is still 0")
        if cards.get('avg_score', {}).get('value', 0) == 0:
            issues.append("Average score is still 0")
        if cards.get('compliance_rate', {}).get('value', 0) == 0:
            issues.append("Compliance rate is still 0")
        
        if issues:
            print(f"\nIssues found after timezone fix:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print(f"\nSUCCESS: Timezone fix worked! Dashboard metrics are now populated.")
        
    except Exception as e:
        print(f"Error testing dashboard: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_timezone_fix()
