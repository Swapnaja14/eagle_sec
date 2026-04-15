import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from accounts.models import User, Tenant
from assessments.models import Quiz

def create_trainers():
    # Get tenant
    tenant = Tenant.objects.first()
    if not tenant:
        print("❌ No tenant found. Please run seed_assessment.py first.")
        return
    
    # Create trainer users
    trainers_data = [
        {
            'username': 'trainer_alice',
            'email': 'alice@example.com',
            'first_name': 'Alice',
            'last_name': 'Johnson',
            'role': 'instructor'
        },
        {
            'username': 'trainer_bob',
            'email': 'bob.trainer@example.com',
            'first_name': 'Bob',
            'last_name': 'Smith',
            'role': 'instructor'
        },
        {
            'username': 'trainer_carol',
            'email': 'carol@example.com',
            'first_name': 'Carol',
            'last_name': 'Williams',
            'role': 'instructor'
        },
    ]
    
    trainers = []
    for trainer_data in trainers_data:
        user, created = User.objects.get_or_create(
            username=trainer_data['username'],
            defaults={
                'email': trainer_data['email'],
                'first_name': trainer_data['first_name'],
                'last_name': trainer_data['last_name'],
                'tenant': tenant,
                'role': trainer_data['role']
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"✓ Created trainer: {user.username} ({user.get_full_name()})")
        else:
            print(f"  Trainer already exists: {user.username}")
        trainers.append(user)
    
    # Assign trainers to existing quiz
    quiz = Quiz.objects.first()
    if quiz:
        quiz.assigned_trainers.set([trainers[0], trainers[1]])  # Assign Alice and Bob
        print(f"\n✓ Assigned trainers to quiz: {quiz.title}")
        print(f"  - {trainers[0].get_full_name()}")
        print(f"  - {trainers[1].get_full_name()}")
    
    print(f"\n{'='*60}")
    print(f"✅ Trainers created successfully!")
    print(f"{'='*60}")
    print(f"\nTrainer Credentials:")
    for trainer_data in trainers_data:
        print(f"  {trainer_data['username']} / password123")
    print(f"\nYou can now:")
    print(f"  1. Login as a trainer")
    print(f"  2. Create assessments")
    print(f"  3. Assign trainers to assessments")

if __name__ == '__main__':
    create_trainers()
