"""
Seed script - run with: python manage.py shell < seed_data.py
Or: python seed_data.py (from backend directory with Django setup)
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from accounts.models import Tenant, User
from questions.models import Question
from content.models import ContentFile, Tag
from courses.models import Course, PreAssessment, PostAssessment, Lesson, Certification

print("Seeding LearnSphere database...")

# Create Tenant
tenant, _ = Tenant.objects.get_or_create(
    slug='techcorp',
    defaults={'name': 'TechCorp Inc.'}
)
print(f"Tenant: {tenant.name}")

# Create Admin User
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
print(f"Admin user: admin / admin123")

# Create Instructor
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
print(f"Instructor: instructor1 / pass1234")

# Create Trainee
trainee, created = User.objects.get_or_create(
    username='trainee1',
    defaults={
        'email': 'trainee@techcorp.com',
        'first_name': 'John',
        'last_name': 'Doe',
        'role': 'trainee',
        'tenant': tenant,
        'department': 'Engineering',
    }
)
if created:
    trainee.set_password('pass1234')
    trainee.save()
print(f"Trainee: trainee1 / pass1234")

# Create Tags
tag_names = ['Security', 'Basics', 'Compliance', 'Network', 'Cloud', 'Python', 'DevOps']
tags = {}
for tag_name in tag_names:
    tag, _ = Tag.objects.get_or_create(name=tag_name, tenant=tenant)
    tags[tag_name] = tag
print(f"Tags: {', '.join(tag_names)}")

# Seed Questions (English)
en_questions = [
    {
        'text': 'What does CIA stand for in cybersecurity?',
        'question_type': 'mcq',
        'language': 'en',
        'difficulty': 'easy',
        'subject': 'cybersecurity',
        'options': ['Confidentiality, Integrity, Availability', 'Central Intelligence Agency', 'Computer Information Access', 'Cyber Incident Analysis'],
        'correct_answer': '0',
        'points': 1,
    },
    {
        'text': 'Which protocol is used to secure web communications?',
        'question_type': 'mcq',
        'language': 'en',
        'difficulty': 'easy',
        'subject': 'cybersecurity',
        'options': ['HTTP', 'FTP', 'HTTPS', 'SMTP'],
        'correct_answer': '2',
        'points': 1,
    },
    {
        'text': 'A firewall is a type of malware.',
        'question_type': 'true_false',
        'language': 'en',
        'difficulty': 'easy',
        'subject': 'cybersecurity',
        'options': ['True', 'False'],
        'correct_answer': 'false',
        'points': 1,
    },
    {
        'text': 'What is the purpose of a VPN?',
        'question_type': 'mcq',
        'language': 'en',
        'difficulty': 'medium',
        'subject': 'networking',
        'options': ['To speed up internet', 'To provide secure encrypted connection', 'To block websites', 'To improve hardware'],
        'correct_answer': '1',
        'points': 2,
    },
    {
        'text': 'Which cloud model provides the most control to the user?',
        'question_type': 'mcq',
        'language': 'en',
        'difficulty': 'medium',
        'subject': 'cloud_computing',
        'options': ['SaaS', 'PaaS', 'IaaS', 'DaaS'],
        'correct_answer': '2',
        'points': 2,
    },
    {
        'text': 'SOC2 compliance is mandatory for all software companies.',
        'question_type': 'true_false',
        'language': 'en',
        'difficulty': 'medium',
        'subject': 'compliance',
        'options': ['True', 'False'],
        'correct_answer': 'false',
        'points': 1,
    },
    {
        'text': 'What is a zero-day vulnerability?',
        'question_type': 'mcq',
        'language': 'en',
        'difficulty': 'hard',
        'subject': 'cybersecurity',
        'options': ['A vulnerability fixed on day zero', 'An unknown vulnerability with no available patch', 'A known vulnerability older than a year', 'A vulnerability in day-trading software'],
        'correct_answer': '1',
        'points': 3,
    },
    {
        'text': 'In DevOps, what does CI/CD stand for?',
        'question_type': 'mcq',
        'language': 'en',
        'difficulty': 'easy',
        'subject': 'devops',
        'options': ['Continuous Integration/Continuous Delivery', 'Computer Integration/Computer Deployment', 'Code Inspection/Code Design', 'Central Integration/Continuous Deployment'],
        'correct_answer': '0',
        'points': 1,
    },
    {
        'text': 'Which ISO standard is related to Information Security Management?',
        'question_type': 'mcq',
        'language': 'en',
        'difficulty': 'medium',
        'subject': 'compliance',
        'options': ['ISO 9001', 'ISO 27001', 'ISO 14001', 'ISO 45001'],
        'correct_answer': '1',
        'points': 2,
    },
    {
        'text': 'Python is a compiled programming language.',
        'question_type': 'true_false',
        'language': 'en',
        'difficulty': 'easy',
        'subject': 'software_development',
        'options': ['True', 'False'],
        'correct_answer': 'false',
        'points': 1,
    },
]

# Hindi Questions
hi_questions = [
    {
        'text': 'साइबर सुरक्षा में CIA का क्या अर्थ है?',
        'question_type': 'mcq',
        'language': 'hi',
        'difficulty': 'easy',
        'subject': 'cybersecurity',
        'options': ['गोपनीयता, अखंडता, उपलब्धता', 'केंद्रीय खुफिया एजेंसी', 'कंप्यूटर सूचना पहुँच', 'साइबर घटना विश्लेषण'],
        'correct_answer': '0',
        'points': 1,
    },
    {
        'text': 'क्लाउड कंप्यूटिंग में SaaS का मतलब क्या है?',
        'question_type': 'mcq',
        'language': 'hi',
        'difficulty': 'easy',
        'subject': 'cloud_computing',
        'options': ['सॉफ़्टवेयर एक सेवा के रूप में', 'सर्वर एक सेवा के रूप में', 'सुरक्षा एक सेवा के रूप में', 'भंडारण एक सेवा के रूप में'],
        'correct_answer': '0',
        'points': 1,
    },
    {
        'text': 'फ़ायरवॉल एक प्रकार का मैलवेयर है।',
        'question_type': 'true_false',
        'language': 'hi',
        'difficulty': 'easy',
        'subject': 'cybersecurity',
        'options': ['सच', 'झूठ'],
        'correct_answer': 'false',
        'points': 1,
    },
    {
        'text': 'DevOps में CI/CD का क्या अर्थ है?',
        'question_type': 'mcq',
        'language': 'hi',
        'difficulty': 'medium',
        'subject': 'devops',
        'options': ['सतत एकीकरण/सतत वितरण', 'केंद्रीय एकीकरण/सतत तैनाती', 'कोड निरीक्षण/कोड डिज़ाइन', 'इनमें से कोई नहीं'],
        'correct_answer': '0',
        'points': 2,
    },
]

# French Questions
fr_questions = [
    {
        'text': 'Que signifie CIA en cybersécurité?',
        'question_type': 'mcq',
        'language': 'fr',
        'difficulty': 'easy',
        'subject': 'cybersecurity',
        'options': ['Confidentialité, Intégrité, Disponibilité', "Agence Centrale d'Intelligence", 'Accès Informatique Central', 'Analyse Cyber Incidente'],
        'correct_answer': '0',
        'points': 1,
    },
    {
        'text': 'Un pare-feu est un type de logiciel malveillant.',
        'question_type': 'true_false',
        'language': 'fr',
        'difficulty': 'easy',
        'subject': 'cybersecurity',
        'options': ['Vrai', 'Faux'],
        'correct_answer': 'false',
        'points': 1,
    },
    {
        'text': 'Quel protocole sécurise les communications Web?',
        'question_type': 'mcq',
        'language': 'fr',
        'difficulty': 'easy',
        'subject': 'cybersecurity',
        'options': ['HTTP', 'FTP', 'HTTPS', 'SMTP'],
        'correct_answer': '2',
        'points': 1,
    },
]

# German Questions
de_questions = [
    {
        'text': 'Was bedeutet CIA in der Cybersicherheit?',
        'question_type': 'mcq',
        'language': 'de',
        'difficulty': 'easy',
        'subject': 'cybersecurity',
        'options': ['Vertraulichkeit, Integrität, Verfügbarkeit', 'Zentrale Geheimdienstagent', 'Computer Informationszugang', 'Cyber Incident Analyse'],
        'correct_answer': '0',
        'points': 1,
    },
    {
        'text': 'Eine Firewall ist eine Art von Malware.',
        'question_type': 'true_false',
        'language': 'de',
        'difficulty': 'easy',
        'subject': 'cybersecurity',
        'options': ['Wahr', 'Falsch'],
        'correct_answer': 'false',
        'points': 1,
    },
]

all_questions = en_questions + hi_questions + fr_questions + de_questions

q_count = 0
for q_data in all_questions:
    q, created = Question.objects.get_or_create(
        text=q_data['text'],
        tenant=tenant,
        defaults={**q_data, 'created_by': instructor}
    )
    if created:
        q_count += 1

print(f"Questions seeded: {q_count} new ({Question.objects.filter(tenant=tenant).count()} total)")

# Create a sample course
course, created = Course.objects.get_or_create(
    display_name='Advanced Cybersecurity Compliance',
    tenant=tenant,
    defaults={
        'description': 'In-depth exploration of corporate compliance standards for high-security environments.',
        'compliance_taxonomy': 'ISO 27001',
        'skills_taxonomy': 'Threat Analysis',
        'status': 'draft',
        'created_by': instructor,
    }
)
if created:
    # Create lessons
    lesson1 = Lesson.objects.create(course=course, title='Introduction to SOC2 Frameworks', order=1)
    lesson2 = Lesson.objects.create(course=course, title='Asset Management Deep Dive', order=2)
    print(f"Course created: {course.display_name} (ID: {course.course_id})")
else:
    print(f" Course already exists: {course.display_name}")

print("\nSeed complete! Login credentials:")
print("   Admin:      admin / admin123")
print("   Instructor: instructor1 / pass1234")
print("   Trainee:    trainee1 / pass1234")
