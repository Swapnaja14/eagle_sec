"""
Comprehensive Dashboard Data Seed Script
Generates realistic sample data for all dashboard components:
- Users with different roles and departments
- Quiz submissions with varied scores
- Training sessions
- Compliance alerts
Run with: python seed_dashboard_data.py
"""
import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from accounts.models import Tenant, User
from questions.models import Question
from assessments.models import Quiz, QuizQuestion, Submission, Answer
from dashboard.models import TrainingSession, ComplianceAlert
from courses.models import Course

def create_dashboard_data():
    print("=" * 60)
    print("Creating Dashboard Sample Data")
    print("=" * 60)
    
    # Get or create tenant
    tenant, _ = Tenant.objects.get_or_create(
        slug='techcorp',
        defaults={'name': 'TechCorp Inc.', 'is_active': True}
    )
    print(f"Tenant: {tenant.name}")
    
    # Get or create admin user
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@techcorp.com',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'admin',
            'tenant': tenant,
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
    
    # Get or create instructor
    instructor, created = User.objects.get_or_create(
        username='instructor1',
        defaults={
            'email': 'instructor@techcorp.com',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'role': 'instructor',
            'tenant': tenant,
            'department': 'IT Training',
        }
    )
    if created:
        instructor.set_password('pass1234')
        instructor.save()
    
    # Create diverse trainee users across departments
    departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations']
    trainees_data = [
        {'username': 'john_engineer', 'first_name': 'John', 'last_name': 'Smith', 'department': 'Engineering'},
        {'username': 'jane_sales', 'first_name': 'Jane', 'last_name': 'Wilson', 'department': 'Sales'},
        {'username': 'bob_marketing', 'first_name': 'Bob', 'last_name': 'Brown', 'department': 'Marketing'},
        {'username': 'alice_hr', 'first_name': 'Alice', 'last_name': 'Davis', 'department': 'HR'},
        {'username': 'charlie_finance', 'first_name': 'Charlie', 'last_name': 'Miller', 'department': 'Finance'},
        {'username': 'diana_ops', 'first_name': 'Diana', 'last_name': 'Garcia', 'department': 'Operations'},
        {'username': 'eve_engineer2', 'first_name': 'Eve', 'last_name': 'Martinez', 'department': 'Engineering'},
        {'username': 'frank_sales2', 'first_name': 'Frank', 'last_name': 'Anderson', 'department': 'Sales'},
        {'username': 'grace_marketing2', 'first_name': 'Grace', 'last_name': 'Taylor', 'department': 'Marketing'},
        {'username': 'henry_hr2', 'first_name': 'Henry', 'last_name': 'Thomas', 'department': 'HR'},
    ]
    
    trainees = []
    for trainee_data in trainees_data:
        trainee, created = User.objects.get_or_create(
            username=trainee_data['username'],
            defaults={
                'email': f"{trainee_data['username']}@techcorp.com",
                'first_name': trainee_data['first_name'],
                'last_name': trainee_data['last_name'],
                'role': 'trainee',
                'tenant': tenant,
                'department': trainee_data['department'],
            }
        )
        if created:
            trainee.set_password('password123')
            trainee.save()
        trainees.append(trainee)
    
    print(f"Created {len(trainees)} trainee users")
    
    # Create multiple quizzes for different subjects
    quizzes_data = [
        {
            'title': 'Cybersecurity Fundamentals',
            'description': 'Basic cybersecurity concepts and best practices',
            'passing_score': 75,
            'time_limit_minutes': 30,
            'subject': 'cybersecurity'
        },
        {
            'title': 'Cloud Computing Essentials',
            'description': 'Introduction to cloud computing concepts and services',
            'passing_score': 70,
            'time_limit_minutes': 25,
            'subject': 'cloud_computing'
        },
        {
            'title': 'Compliance and Risk Management',
            'description': 'Understanding compliance frameworks and risk assessment',
            'passing_score': 80,
            'time_limit_minutes': 40,
            'subject': 'compliance'
        }
    ]
    
    quizzes = []
    for quiz_data in quizzes_data:
        quiz, created = Quiz.objects.get_or_create(
            title=quiz_data['title'],
            tenant=tenant,
            defaults={
                'description': quiz_data['description'],
                'created_by': instructor,
                'time_limit_minutes': quiz_data['time_limit_minutes'],
                'passing_score': quiz_data['passing_score'],
                'max_attempts': 3,
                'randomize_questions': False,
                'show_correct_answers': True,
                'is_active': True
            }
        )
        quizzes.append(quiz)
        
        if created:
            # Create sample questions for each quiz
            questions_data = get_questions_for_subject(quiz_data['subject'])
            for idx, q_data in enumerate(questions_data, 1):
                question, _ = Question.objects.get_or_create(
                    text=q_data['text'],
                    tenant=tenant,
                    defaults={
                        'question_type': q_data['question_type'],
                        'language': 'en',
                        'difficulty': q_data['difficulty'],
                        'subject': q_data['subject'],
                        'options': q_data['options'],
                        'correct_answer': q_data['correct_answer'],
                        'explanation': q_data.get('explanation', ''),
                        'points': q_data['points'],
                        'is_active': True,
                        'created_by': instructor
                    }
                )
                
                QuizQuestion.objects.get_or_create(
                    quiz=quiz,
                    question=question,
                    defaults={
                        'order': idx,
                        'points': q_data['points']
                    }
                )
    
    print(f"Created {len(quizzes)} quizzes")
    
    # Generate realistic quiz submissions with varied performance
    submission_scenarios = [
        # High performers (85-100%)
        {'score_range': (85, 100), 'count': 8, 'status': 'completed'},
        # Good performers (70-84%)
        {'score_range': (70, 84), 'count': 12, 'status': 'completed'},
        # Borderline (60-69%)
        {'score_range': (60, 69), 'count': 6, 'status': 'completed'},
        # Failed (below 60%)
        {'score_range': (40, 59), 'count': 4, 'status': 'completed'},
        # In progress
        {'score_range': (0, 0), 'count': 3, 'status': 'in_progress'},
    ]
    
    submissions_created = 0
    for scenario in submission_scenarios:
        for i in range(scenario['count']):
            # Random trainee and quiz
            trainee = trainees[i % len(trainees)]
            quiz = quizzes[(i + submissions_created) % len(quizzes)]
            
            # Check if submission already exists
            existing = Submission.objects.filter(user=trainee, quiz=quiz).first()
            if existing:
                continue
            
            # Create submission
            submission = Submission.objects.create(
                user=trainee,
                quiz=quiz,
                attempt_number=1,
                status=scenario['status'],
                started_at=timezone.now() - timedelta(days=i, hours=i*2)
            )
            
            if scenario['status'] == 'completed':
                # Generate realistic answers
                quiz_questions = list(quiz.quiz_questions.all().order_by('order'))
                total_points = sum(qq.points for qq in quiz_questions)
                
                # Calculate target score
                min_score, max_score = scenario['score_range']
                if max_score == 0:  # In progress case
                    continue
                    
                target_percentage = (min_score + max_score) / 2
                target_score = (target_percentage / 100) * total_points
                target_correct = int(target_score / (total_points / len(quiz_questions)))
                
                correct_count = 0
                total_score = 0
                
                for idx, qq in enumerate(quiz_questions):
                    question = qq.question
                    
                    # Decide if this answer should be correct
                    should_be_correct = correct_count < target_correct
                    
                    if should_be_correct:
                        selected_answer = question.correct_answer
                        is_correct = True
                        points_earned = qq.points
                        correct_count += 1
                        total_score += points_earned
                    else:
                        # Select a wrong answer
                        if question.question_type == 'mcq':
                            wrong_options = [str(i) for i in range(len(question.options)) if str(i) != question.correct_answer]
                            selected_answer = wrong_options[0] if wrong_options else '0'
                        else:
                            selected_answer = 'true' if question.correct_answer == 'false' else 'false'
                        is_correct = False
                        points_earned = 0
                    
                    Answer.objects.create(
                        submission=submission,
                        question=question,
                        quiz_question=qq,
                        selected_answer=selected_answer,
                        is_correct=is_correct,
                        points_earned=points_earned
                    )
                
                # Complete submission
                percentage = (total_score / total_points * 100) if total_points > 0 else 0
                passed = percentage >= quiz.passing_score
                
                submission.score = total_score
                submission.total_points = total_points
                submission.percentage = percentage
                submission.passed = passed
                submission.submitted_at = submission.started_at + timedelta(minutes=quiz.time_limit_minutes - 5)
                submission.time_taken_seconds = (quiz.time_limit_minutes - 5) * 60
                submission.save()
                
            submissions_created += 1
    
    print(f"Created {submissions_created} quiz submissions")
    
    # Create upcoming training sessions
    sessions_data = [
        {
            'topic': 'Advanced Threat Detection Techniques',
            'session_type': 'virtual',
            'date_time': timezone.now() + timedelta(days=2, hours=10),
            'attendee_count': 25,
            'department': 'Engineering'
        },
        {
            'topic': 'Compliance Framework Workshop',
            'session_type': 'classroom',
            'date_time': timezone.now() + timedelta(days=5, hours=14),
            'attendee_count': 15,
            'department': 'HR'
        },
        {
            'topic': 'Cloud Security Best Practices',
            'session_type': 'virtual',
            'date_time': timezone.now() + timedelta(days=7, hours=11),
            'attendee_count': 30,
            'department': 'Operations'
        },
        {
            'topic': 'Incident Response Planning',
            'session_type': 'classroom',
            'date_time': timezone.now() + timedelta(days=10, hours=9),
            'attendee_count': 20,
            'department': 'Finance'
        },
        {
            'topic': 'Data Privacy Regulations',
            'session_type': 'virtual',
            'date_time': timezone.now() + timedelta(days=14, hours=13),
            'attendee_count': 18,
            'department': 'Marketing'
        }
    ]
    
    for session_data in sessions_data:
        TrainingSession.objects.get_or_create(
            topic=session_data['topic'],
            tenant=tenant,
            defaults={
                'trainer': instructor,
                'session_type': session_data['session_type'],
                'date_time': session_data['date_time'],
                'attendee_count': session_data['attendee_count'],
                'department': session_data['department'],
                'site': 'Headquarters' if session_data['session_type'] == 'classroom' else 'Virtual',
                'is_active': True
            }
        )
    
    print(f"Created {len(sessions_data)} training sessions")
    
    # Create compliance alerts
    alerts_data = [
        {
            'department': 'Sales',
            'site': 'Regional Office West',
            'behind_percent': 15.5,
            'severity': 'medium',
            'affected_count': 8
        },
        {
            'department': 'Marketing',
            'site': 'Headquarters',
            'behind_percent': 22.0,
            'severity': 'high',
            'affected_count': 5
        },
        {
            'department': 'Finance',
            'site': 'Regional Office East',
            'behind_percent': 8.2,
            'severity': 'low',
            'affected_count': 3
        }
    ]
    
    for alert_data in alerts_data:
        ComplianceAlert.objects.get_or_create(
            department=alert_data['department'],
            tenant=tenant,
            defaults={
                'site': alert_data['site'],
                'behind_percent': alert_data['behind_percent'],
                'severity': alert_data['severity'],
                'affected_count': alert_data['affected_count'],
                'is_active': True
            }
        )
    
    print(f"Created {len(alerts_data)} compliance alerts")
    
    # Summary
    print("\n" + "=" * 60)
    print("Dashboard Data Creation Complete!")
    print("=" * 60)
    print(f"Users: {User.objects.filter(tenant=tenant).count()}")
    print(f"Quizzes: {Quiz.objects.filter(tenant=tenant).count()}")
    print(f"Submissions: {Submission.objects.filter(quiz__tenant=tenant).count()}")
    print(f"Passed: {Submission.objects.filter(quiz__tenant=tenant, passed=True).count()}")
    print(f"Failed: {Submission.objects.filter(quiz__tenant=tenant, passed=False, status='completed').count()}")
    print(f"Training Sessions: {TrainingSession.objects.filter(tenant=tenant).count()}")
    print(f"Compliance Alerts: {ComplianceAlert.objects.filter(tenant=tenant).count()}")
    print("\nLogin Credentials:")
    print("  Admin: admin / admin123")
    print("  Instructor: instructor1 / pass1234")
    print("  Trainees: [username] / password123")
    print("\nYou can now:")
    print("  1. Start the server: python manage.py runserver")
    print("  2. View dashboard: http://localhost:8000/dashboard")
    print("  3. Access admin: http://localhost:8000/admin")

def get_questions_for_subject(subject):
    """Get sample questions based on subject"""
    
    if subject == 'cybersecurity':
        return [
            {
                'text': 'What does CIA stand for in cybersecurity?',
                'question_type': 'mcq',
                'difficulty': 'easy',
                'subject': 'cybersecurity',
                'options': ['Confidentiality, Integrity, Availability', 'Central Intelligence Agency', 'Computer Information Access', 'Cyber Incident Analysis'],
                'correct_answer': '0',
                'explanation': 'CIA triad represents the core principles of information security.',
                'points': 10
            },
            {
                'text': 'Which protocol is used to secure web communications?',
                'question_type': 'mcq',
                'difficulty': 'easy',
                'subject': 'cybersecurity',
                'options': ['HTTP', 'FTP', 'HTTPS', 'SMTP'],
                'correct_answer': '2',
                'explanation': 'HTTPS (HTTP Secure) encrypts communications between browser and server.',
                'points': 10
            },
            {
                'text': 'A firewall is a type of malware.',
                'question_type': 'true_false',
                'difficulty': 'easy',
                'subject': 'cybersecurity',
                'options': ['True', 'False'],
                'correct_answer': 'false',
                'explanation': 'A firewall is a security device, not malware.',
                'points': 5
            },
            {
                'text': 'What is a zero-day vulnerability?',
                'question_type': 'mcq',
                'difficulty': 'hard',
                'subject': 'cybersecurity',
                'options': ['A vulnerability fixed on day zero', 'An unknown vulnerability with no available patch', 'A known vulnerability older than a year', 'A vulnerability in day-trading software'],
                'correct_answer': '1',
                'explanation': 'Zero-day vulnerabilities are unknown to the vendor and have no patch.',
                'points': 15
            },
            {
                'text': 'Multi-factor authentication requires at least how many verification methods?',
                'question_type': 'mcq',
                'difficulty': 'medium',
                'subject': 'cybersecurity',
                'options': ['1', '2', '3', '4'],
                'correct_answer': '1',
                'explanation': 'Multi-factor authentication requires two or more verification methods.',
                'points': 10
            }
        ]
    
    elif subject == 'cloud_computing':
        return [
            {
                'text': 'Which cloud model provides the most control to the user?',
                'question_type': 'mcq',
                'difficulty': 'medium',
                'subject': 'cloud_computing',
                'options': ['SaaS', 'PaaS', 'IaaS', 'DaaS'],
                'correct_answer': '2',
                'explanation': 'IaaS (Infrastructure as a Service) provides the most control over computing resources.',
                'points': 10
            },
            {
                'text': 'What is the purpose of a VPN in cloud computing?',
                'question_type': 'mcq',
                'difficulty': 'easy',
                'subject': 'cloud_computing',
                'options': ['To speed up internet', 'To provide secure encrypted connection', 'To block websites', 'To improve hardware'],
                'correct_answer': '1',
                'explanation': 'VPNs provide secure encrypted connections to cloud resources.',
                'points': 10
            },
            {
                'text': 'SaaS stands for Software as a Service.',
                'question_type': 'true_false',
                'difficulty': 'easy',
                'subject': 'cloud_computing',
                'options': ['True', 'False'],
                'correct_answer': 'true',
                'explanation': 'SaaS is one of the main cloud service models.',
                'points': 5
            },
            {
                'text': 'Which of these is NOT a major cloud provider?',
                'question_type': 'mcq',
                'difficulty': 'easy',
                'subject': 'cloud_computing',
                'options': ['AWS', 'Azure', 'Google Cloud', 'CloudNet'],
                'correct_answer': '3',
                'explanation': 'AWS, Azure, and Google Cloud are the major cloud providers.',
                'points': 10
            },
            {
                'text': 'What does the shared responsibility model define?',
                'question_type': 'mcq',
                'difficulty': 'medium',
                'subject': 'cloud_computing',
                'options': ['Cost sharing', 'Security responsibilities', 'Resource allocation', 'Data ownership'],
                'correct_answer': '1',
                'explanation': 'The shared responsibility model defines security responsibilities between provider and customer.',
                'points': 10
            }
        ]
    
    elif subject == 'compliance':
        return [
            {
                'text': 'Which ISO standard is related to Information Security Management?',
                'question_type': 'mcq',
                'difficulty': 'medium',
                'subject': 'compliance',
                'options': ['ISO 9001', 'ISO 27001', 'ISO 14001', 'ISO 45001'],
                'correct_answer': '1',
                'explanation': 'ISO 27001 is the international standard for information security management.',
                'points': 10
            },
            {
                'text': 'SOC2 compliance is mandatory for all software companies.',
                'question_type': 'true_false',
                'difficulty': 'medium',
                'subject': 'compliance',
                'options': ['True', 'False'],
                'correct_answer': 'false',
                'explanation': 'SOC2 is not mandatory but often required by customers.',
                'points': 5
            },
            {
                'text': 'What does GDPR primarily protect?',
                'question_type': 'mcq',
                'difficulty': 'easy',
                'subject': 'compliance',
                'options': ['Financial data', 'Personal data', 'Medical records', 'Trade secrets'],
                'correct_answer': '1',
                'explanation': 'GDPR protects personal data and privacy of EU citizens.',
                'points': 10
            },
            {
                'text': 'Which framework focuses on cybersecurity risk management?',
                'question_type': 'mcq',
                'difficulty': 'medium',
                'subject': 'compliance',
                'options': ['ITIL', 'NIST CSF', 'COBIT', 'ISO 9001'],
                'correct_answer': '1',
                'explanation': 'NIST Cybersecurity Framework (CSF) focuses on risk management.',
                'points': 10
            },
            {
                'text': 'PCI-DSS applies to organizations that handle credit card data.',
                'question_type': 'true_false',
                'difficulty': 'easy',
                'subject': 'compliance',
                'options': ['True', 'False'],
                'correct_answer': 'true',
                'explanation': 'PCI-DSS is required for any organization that stores, processes, or transmits credit card data.',
                'points': 5
            }
        ]
    
    return []

if __name__ == '__main__':
    create_dashboard_data()
