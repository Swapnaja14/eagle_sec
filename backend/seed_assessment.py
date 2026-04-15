import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from accounts.models import User, Tenant
from questions.models import Question
from assessments.models import Quiz, QuizQuestion

def create_assessment_data():
    # Get or create tenant
    tenant, _ = Tenant.objects.get_or_create(
        slug='default',
        defaults={'name': 'Default Organization', 'is_active': True}
    )
    
    # Get or create admin user
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123',
            tenant=tenant
        )
        print(f"Created admin user: admin / admin123")
    
    # Create Quiz
    quiz, created = Quiz.objects.get_or_create(
        title='Python Programming Fundamentals',
        tenant=tenant,
        defaults={
            'description': 'Test your knowledge of Python programming basics',
            'created_by': admin_user,
            'time_limit_minutes': 30,
            'passing_score': 70,
            'max_attempts': 3,
            'randomize_questions': True,
            'show_correct_answers': True,
            'is_active': True
        }
    )
    
    if created:
        print(f"✓ Created quiz: {quiz.title}")
    else:
        print(f"Quiz already exists: {quiz.title}")
        # Clear existing questions
        QuizQuestion.objects.filter(quiz=quiz).delete()
    
    # Python questions with 4 options each
    questions_data = [
        {
            'text': 'What is the output of: print(type([]))?',
            'options': ["<class 'list'>", "<class 'dict'>", "<class 'tuple'>", "<class 'set'>"],
            'correct_answer': '0',
            'explanation': 'Square brackets [] create a list in Python.',
            'subject': 'software_development',
            'difficulty': 'easy'
        },
        {
            'text': 'Which keyword is used to define a function in Python?',
            'options': ['function', 'def', 'func', 'define'],
            'correct_answer': '1',
            'explanation': 'The "def" keyword is used to define functions in Python.',
            'subject': 'software_development',
            'difficulty': 'easy'
        },
        {
            'text': 'What is the correct way to create a dictionary in Python?',
            'options': ['{"key": "value"}', '["key", "value"]', '("key", "value")', '<"key", "value">'],
            'correct_answer': '0',
            'explanation': 'Dictionaries are created using curly braces with key-value pairs.',
            'subject': 'software_development',
            'difficulty': 'easy'
        },
        {
            'text': 'Which of the following is a mutable data type in Python?',
            'options': ['tuple', 'string', 'list', 'int'],
            'correct_answer': '2',
            'explanation': 'Lists are mutable, meaning they can be modified after creation.',
            'subject': 'software_development',
            'difficulty': 'medium'
        },
        {
            'text': 'What does the len() function return?',
            'options': ['The type of object', 'The length of an object', 'The memory address', 'The value of object'],
            'correct_answer': '1',
            'explanation': 'len() returns the number of items in an object.',
            'subject': 'software_development',
            'difficulty': 'easy'
        },
        {
            'text': 'What is the output of: print(3 ** 2)?',
            'options': ['6', '9', '5', '8'],
            'correct_answer': '1',
            'explanation': 'The ** operator is used for exponentiation. 3^2 = 9.',
            'subject': 'software_development',
            'difficulty': 'easy'
        },
        {
            'text': 'Which method is used to add an element to the end of a list?',
            'options': ['add()', 'append()', 'insert()', 'push()'],
            'correct_answer': '1',
            'explanation': 'The append() method adds an element to the end of a list.',
            'subject': 'software_development',
            'difficulty': 'easy'
        },
        {
            'text': 'What is the correct syntax for a for loop in Python?',
            'options': ['for i in range(10):', 'for (i=0; i<10; i++)', 'for i to 10:', 'loop i in range(10):'],
            'correct_answer': '0',
            'explanation': 'Python uses "for variable in iterable:" syntax.',
            'subject': 'software_development',
            'difficulty': 'easy'
        },
        {
            'text': 'What does the "break" statement do in a loop?',
            'options': ['Skips current iteration', 'Exits the loop', 'Pauses the loop', 'Restarts the loop'],
            'correct_answer': '1',
            'explanation': 'The break statement terminates the loop immediately.',
            'subject': 'software_development',
            'difficulty': 'medium'
        },
        {
            'text': 'Which of these is NOT a valid Python data type?',
            'options': ['list', 'dictionary', 'array', 'tuple'],
            'correct_answer': '2',
            'explanation': 'Array is not a built-in Python data type. Lists are used instead.',
            'subject': 'software_development',
            'difficulty': 'medium'
        }
    ]
    
    # Create questions and link to quiz
    for idx, q_data in enumerate(questions_data, 1):
        question, created = Question.objects.get_or_create(
            text=q_data['text'],
            tenant=tenant,
            defaults={
                'question_type': 'mcq',
                'language': 'en',
                'difficulty': q_data['difficulty'],
                'subject': q_data['subject'],
                'options': q_data['options'],
                'correct_answer': q_data['correct_answer'],
                'explanation': q_data['explanation'],
                'points': 10,
                'is_active': True,
                'created_by': admin_user
            }
        )
        
        if created:
            print(f"  ✓ Created question {idx}: {q_data['text'][:50]}...")
        
        # Link question to quiz
        QuizQuestion.objects.get_or_create(
            quiz=quiz,
            question=question,
            defaults={
                'order': idx,
                'points': 10
            }
        )
    
    print(f"\n✅ Assessment setup complete!")
    print(f"Quiz: {quiz.title}")
    print(f"Total Questions: {quiz.quiz_questions.count()}")
    print(f"Total Points: {sum(qq.points for qq in quiz.quiz_questions.all())}")
    print(f"\nYou can now:")
    print(f"1. Start the server: python manage.py runserver")
    print(f"2. Access admin: http://localhost:8000/admin/")
    print(f"3. View quiz API: http://localhost:8000/api/assessments/quizzes/{quiz.id}/")

if __name__ == '__main__':
    create_assessment_data()
