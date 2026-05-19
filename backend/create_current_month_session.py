#!/usr/bin/env python
"""
Create a training session for the current month so it appears in the calendar
"""
import os
import sys
import django
from datetime import timedelta

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from dashboard.models import TrainingSession
from accounts.models import User
from django.utils import timezone

def main():
    # Get trainer and trainee
    try:
        trainer = User.objects.get(username='vaishu_210')
        trainee = User.objects.get(username='amit_210')
    except User.DoesNotExist as e:
        print(f"❌ User not found: {e}")
        return
    
    # Create a session for current month (May 2026) - 5 days from now
    session_date = timezone.now() + timedelta(days=5)
    
    # Check if session already exists
    existing = TrainingSession.objects.filter(
        topic='Python Basics Workshop',
        trainer=trainer
    ).first()
    
    if existing:
        print(f"✅ Session already exists: {existing.topic}")
        print(f"   Date: {existing.date_time}")
        return
    
    session = TrainingSession.objects.create(
        tenant=trainer.tenant,
        topic='Python Basics Workshop',
        notes='Introduction to Python programming for beginners',
        session_type='virtual',
        date_time=session_date,
        duration_minutes=90,
        venue='',
        meeting_link='https://meet.google.com/abc-defg-hij',
        trainer=trainer,
        department=trainer.department,
        status='scheduled',
        attendee_count=0,
        max_participants=30
    )
    
    print(f"✅ Created session: {session.topic}")
    print(f"   Date: {session.date_time.strftime('%Y-%m-%d at %I:%M %p')}")
    print(f"   Trainer: {trainer.username} ({trainer.department})")
    print(f"   Type: {session.session_type}")
    print(f"   Department: {session.department}")
    print(f"   Meeting Link: {session.meeting_link}")
    
    # Verify it will show for trainee
    print(f"\n✅ This session will be visible to trainee '{trainee.username}' because:")
    print(f"   - Trainer department: {trainer.department}")
    print(f"   - Trainee department: {trainee.department}")
    print(f"   - Departments match: {trainer.department == trainee.department}")

if __name__ == '__main__':
    main()
