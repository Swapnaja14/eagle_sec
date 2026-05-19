"""
Check quiz setup for certificate generation
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from assessments.models import Quiz, QuizQuestion
from courses.models import Course
from accounts.models import User

print("="*70)
print("  QUIZ SETUP DIAGNOSTIC")
print("="*70)

# Check quizzes
quizzes = Quiz.objects.filter(is_active=True)
print(f"\n✓ Found {quizzes.count()} active quizzes")

for quiz in quizzes:
    print(f"\n📝 Quiz: {quiz.title} (ID: {quiz.id})")
    print(f"   Tenant: {quiz.tenant.name if quiz.tenant else 'None'}")
    print(f"   Course: {quiz.course.display_name if quiz.course else '❌ NOT LINKED'}")
    print(f"   Passing Score: {quiz.passing_score}%")
    print(f"   Max Attempts: {quiz.max_attempts}")
    print(f"   Questions: {quiz.quiz_questions.count()}")
    
    if not quiz.course:
        print(f"   ⚠️  WARNING: Quiz not linked to course - certificate won't generate")
        print(f"   💡 FIX: Link quiz to a course in admin panel")
        
        # Show available courses
        courses = Course.objects.filter(tenant=quiz.tenant, status='active')
        if courses.exists():
            print(f"   Available courses:")
            for course in courses[:5]:
                print(f"      - {course.display_name} (ID: {course.id})")
    
    # Check questions
    questions = quiz.quiz_questions.all()
    if questions.count() == 0:
        print(f"   ⚠️  WARNING: No questions in quiz")
    else:
        print(f"   ✓ Questions configured:")
        for qq in questions[:3]:
            print(f"      - {qq.question.text[:50]}... ({qq.points} points)")

print("\n" + "="*70)
print("  RECOMMENDATIONS")
print("="*70)

# Check for quizzes without courses
quizzes_without_course = Quiz.objects.filter(is_active=True, course__isnull=True)
if quizzes_without_course.exists():
    print(f"\n⚠️  {quizzes_without_course.count()} quiz(es) not linked to courses:")
    for quiz in quizzes_without_course:
        print(f"   - {quiz.title} (ID: {quiz.id})")
    print("\n💡 To fix:")
    print("   1. Go to Django admin: http://localhost:8000/admin/")
    print("   2. Navigate to Assessments > Quizzes")
    print("   3. Edit each quiz and select a course")
    print("   4. Save")
else:
    print("\n✅ All quizzes are linked to courses")

# Check for quizzes without questions
quizzes_without_questions = []
for quiz in Quiz.objects.filter(is_active=True):
    if quiz.quiz_questions.count() == 0:
        quizzes_without_questions.append(quiz)

if quizzes_without_questions:
    print(f"\n⚠️  {len(quizzes_without_questions)} quiz(es) without questions:")
    for quiz in quizzes_without_questions:
        print(f"   - {quiz.title} (ID: {quiz.id})")
    print("\n💡 To fix:")
    print("   1. Go to Django admin")
    print("   2. Add questions to each quiz")
else:
    print("\n✅ All quizzes have questions")

print("\n" + "="*70)
