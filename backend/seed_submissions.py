import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from accounts.models import User, Tenant
from assessments.models import Quiz, QuizQuestion, Submission, Answer
from questions.models import Question

def create_sample_submissions():
    # Get the quiz and tenant
    quiz = Quiz.objects.first()
    if not quiz:
        print("❌ No quiz found. Please run seed_assessment.py first.")
        return
    
    tenant = quiz.tenant
    
    # Create sample users (trainees)
    users_data = [
        {'username': 'john_doe', 'email': 'john@example.com', 'first_name': 'John', 'last_name': 'Doe'},
        {'username': 'jane_smith', 'email': 'jane@example.com', 'first_name': 'Jane', 'last_name': 'Smith'},
        {'username': 'bob_wilson', 'email': 'bob@example.com', 'first_name': 'Bob', 'last_name': 'Wilson'},
    ]
    
    users = []
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'tenant': tenant,
                'role': 'trainee'
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"✓ Created user: {user.username}")
        users.append(user)
    
    # Get all quiz questions
    quiz_questions = list(quiz.quiz_questions.all().order_by('order'))
    total_points = sum(qq.points for qq in quiz_questions)
    
    # Submission scenarios
    scenarios = [
        {
            'user': users[0],
            'name': 'John Doe - Perfect Score',
            'answers': [0, 1, 0, 2, 1, 1, 1, 0, 1, 2],  # All correct
            'time_taken': 1200  # 20 minutes
        },
        {
            'user': users[1],
            'name': 'Jane Smith - Good Score',
            'answers': [0, 1, 0, 2, 1, 1, 0, 0, 1, 2],  # 9/10 correct (Q7 wrong)
            'time_taken': 1500  # 25 minutes
        },
        {
            'user': users[2],
            'name': 'Bob Wilson - Failed',
            'answers': [1, 0, 1, 0, 0, 0, 0, 1, 0, 0],  # 0/10 correct (all wrong)
            'time_taken': 900  # 15 minutes
        },
    ]
    
    print(f"\n{'='*60}")
    print(f"Creating submissions for quiz: {quiz.title}")
    print(f"{'='*60}\n")
    
    for scenario in scenarios:
        user = scenario['user']
        
        # Check if submission already exists
        existing = Submission.objects.filter(user=user, quiz=quiz).first()
        if existing:
            print(f"⚠ Submission already exists for {user.username}, deleting...")
            existing.delete()
        
        # Create submission
        submission = Submission.objects.create(
            user=user,
            quiz=quiz,
            attempt_number=1,
            status='in_progress',
            started_at=timezone.now()
        )
        
        print(f"\n📝 {scenario['name']}")
        print(f"   User: {user.username}")
        
        # Submit answers
        correct_count = 0
        total_score = 0
        
        for idx, (qq, selected_idx) in enumerate(zip(quiz_questions, scenario['answers']), 1):
            question = qq.question
            selected_answer = str(selected_idx)
            is_correct = selected_answer == question.correct_answer
            points_earned = qq.points if is_correct else 0
            
            if is_correct:
                correct_count += 1
                total_score += points_earned
            
            # Create answer
            Answer.objects.create(
                submission=submission,
                question=question,
                quiz_question=qq,
                selected_answer=selected_answer,
                is_correct=is_correct,
                points_earned=points_earned
            )
            
            status = "✓" if is_correct else "✗"
            print(f"   Q{idx}: {status} Selected: {selected_idx}, Correct: {question.correct_answer} ({points_earned} pts)")
        
        # Complete submission
        percentage = (total_score / total_points * 100) if total_points > 0 else 0
        passed = percentage >= quiz.passing_score
        
        submission.score = total_score
        submission.total_points = total_points
        submission.percentage = percentage
        submission.passed = passed
        submission.status = 'completed'
        submission.submitted_at = timezone.now()
        submission.time_taken_seconds = scenario['time_taken']
        submission.save()
        
        print(f"\n   📊 Results:")
        print(f"      Correct: {correct_count}/{len(quiz_questions)}")
        print(f"      Score: {total_score}/{total_points}")
        print(f"      Percentage: {percentage:.1f}%")
        print(f"      Status: {'✅ PASSED' if passed else '❌ FAILED'}")
        print(f"      Time: {scenario['time_taken']//60} min {scenario['time_taken']%60} sec")
    
    print(f"\n{'='*60}")
    print(f"✅ Submissions created successfully!")
    print(f"{'='*60}")
    print(f"\nSummary:")
    print(f"  Total Submissions: {Submission.objects.filter(quiz=quiz).count()}")
    print(f"  Passed: {Submission.objects.filter(quiz=quiz, passed=True).count()}")
    print(f"  Failed: {Submission.objects.filter(quiz=quiz, passed=False).count()}")
    print(f"\nTest Users Created:")
    for user in users:
        print(f"  - {user.username} / password123")
    print(f"\nYou can now:")
    print(f"  1. View submissions in admin: http://localhost:8000/admin/assessments/submission/")
    print(f"  2. API endpoint: http://localhost:8000/api/assessments/submissions/")
    print(f"  3. Login as any test user to see their results")

if __name__ == '__main__':
    create_sample_submissions()
