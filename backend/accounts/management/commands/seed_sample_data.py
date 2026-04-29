"""
Management command to seed sample data for e-learning platform
Usage: python manage.py seed_sample_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Tenant
from courses.models import Course, Lesson, PreAssessment, PostAssessment, Certification

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds sample data: tenant, users, 10 courses with lessons'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding sample data...')

        # Create tenant
        tenant, created = Tenant.objects.get_or_create(
            slug='demo-org',
            defaults={
                'name': 'Demo Organization',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Created tenant: {tenant.name}'))

        # Create sample users
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@demo.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': User.ROLE_ADMIN,
                'tenant': tenant,
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('✅ Created admin user (admin/admin123)'))

        instructor, created = User.objects.get_or_create(
            username='instructor',
            defaults={
                'email': 'instructor@demo.com',
                'first_name': 'John',
                'last_name': 'Instructor',
                'role': User.ROLE_INSTRUCTOR,
                'tenant': tenant
            }
        )
        if created:
            instructor.set_password('instructor123')
            instructor.save()
            self.stdout.write(self.style.SUCCESS('✅ Created instructor user'))

        trainee, created = User.objects.get_or_create(
            username='trainee',
            defaults={
                'email': 'trainee@demo.com',
                'first_name': 'Jane',
                'last_name': 'Trainee',
                'role': User.ROLE_TRAINEE,
                'tenant': tenant,
                'department': 'IT Security'
            }
        )
        if created:
            trainee.set_password('trainee123')
            trainee.save()
            self.stdout.write(self.style.SUCCESS('✅ Created trainee user'))

        # Sample courses data
        courses_data = [
            {
                'display_name': 'Cybersecurity Fundamentals',
                'description': 'Learn the basics of cybersecurity including threat landscape, security principles, and best practices for protecting digital assets.',
                'compliance_taxonomy': 'ISO 27001',
                'skills_taxonomy': 'Threat Analysis',
                'lessons': [
                    'Introduction to Cybersecurity',
                    'Common Cyber Threats',
                    'Security Principles (CIA Triad)',
                    'Password Security & Authentication'
                ]
            },
            {
                'display_name': 'Network Security Essentials',
                'description': 'Master network security concepts including firewalls, VPNs, intrusion detection systems, and secure network architecture.',
                'compliance_taxonomy': 'NIST',
                'skills_taxonomy': 'Threat Analysis',
                'lessons': [
                    'Network Security Basics',
                    'Firewalls and Access Control',
                    'VPN Technologies',
                    'Intrusion Detection Systems'
                ]
            },
            {
                'display_name': 'Cloud Security Best Practices',
                'description': 'Comprehensive guide to securing cloud infrastructure across AWS, Azure, and Google Cloud platforms.',
                'compliance_taxonomy': 'SOC2',
                'skills_taxonomy': 'Cloud Architecture',
                'lessons': [
                    'Cloud Security Fundamentals',
                    'Identity and Access Management',
                    'Data Encryption in Cloud',
                    'Cloud Compliance and Governance'
                ]
            },
            {
                'display_name': 'Incident Response & Forensics',
                'description': 'Learn how to detect, respond to, and investigate security incidents using industry-standard frameworks and tools.',
                'compliance_taxonomy': 'NIST',
                'skills_taxonomy': 'Incident Response',
                'lessons': [
                    'Incident Response Lifecycle',
                    'Digital Forensics Basics',
                    'Evidence Collection and Preservation',
                    'Post-Incident Analysis'
                ]
            },
            {
                'display_name': 'Penetration Testing Fundamentals',
                'description': 'Hands-on introduction to ethical hacking and penetration testing methodologies, tools, and techniques.',
                'compliance_taxonomy': 'none',
                'skills_taxonomy': 'Penetration Testing',
                'lessons': [
                    'Introduction to Penetration Testing',
                    'Reconnaissance and Scanning',
                    'Exploitation Techniques',
                    'Reporting and Remediation'
                ]
            },
            {
                'display_name': 'Secure Coding in Python',
                'description': 'Write secure Python code by understanding common vulnerabilities and implementing security best practices.',
                'compliance_taxonomy': 'none',
                'skills_taxonomy': 'Python',
                'lessons': [
                    'Common Security Vulnerabilities',
                    'Input Validation and Sanitization',
                    'Secure Authentication Implementation',
                    'Cryptography in Python'
                ]
            },
            {
                'display_name': 'DevSecOps Pipeline Security',
                'description': 'Integrate security into your CI/CD pipeline with automated testing, vulnerability scanning, and secure deployment practices.',
                'compliance_taxonomy': 'none',
                'skills_taxonomy': 'DevSecOps',
                'lessons': [
                    'DevSecOps Principles',
                    'Security in CI/CD Pipelines',
                    'Container Security',
                    'Infrastructure as Code Security'
                ]
            },
            {
                'display_name': 'GDPR Compliance Training',
                'description': 'Understand GDPR requirements, data protection principles, and how to ensure compliance in your organization.',
                'compliance_taxonomy': 'GDPR',
                'skills_taxonomy': 'Risk Management',
                'lessons': [
                    'GDPR Overview and Principles',
                    'Data Subject Rights',
                    'Data Protection Impact Assessments',
                    'Breach Notification Requirements'
                ]
            },
            {
                'display_name': 'Kubernetes Security',
                'description': 'Secure your Kubernetes clusters with proper configuration, network policies, RBAC, and runtime security.',
                'compliance_taxonomy': 'none',
                'skills_taxonomy': 'Kubernetes',
                'lessons': [
                    'Kubernetes Architecture Security',
                    'Pod Security Standards',
                    'Network Policies and Segmentation',
                    'Secrets Management'
                ]
            },
            {
                'display_name': 'Security Awareness for Employees',
                'description': 'Essential security awareness training covering phishing, social engineering, password hygiene, and safe browsing.',
                'compliance_taxonomy': 'ISO 27001',
                'skills_taxonomy': 'Risk Management',
                'lessons': [
                    'Recognizing Phishing Attacks',
                    'Social Engineering Tactics',
                    'Password Best Practices',
                    'Safe Internet and Email Usage'
                ]
            }
        ]

        # Create courses
        for idx, course_data in enumerate(courses_data, 1):
            lessons_data = course_data.pop('lessons')
            
            course, created = Course.objects.get_or_create(
                display_name=course_data['display_name'],
                tenant=tenant,
                defaults={
                    **course_data,
                    'created_by': admin_user,
                    'status': 'active'
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ Created course: {course.display_name}'))
                
                # Create lessons
                for order, lesson_title in enumerate(lessons_data, 1):
                    Lesson.objects.create(
                        course=course,
                        title=lesson_title,
                        order=order
                    )
                
                # Create pre-assessment
                PreAssessment.objects.get_or_create(
                    course=course,
                    defaults={
                        'is_active': True,
                        'single_attempt': True,
                        'time_limit_minutes': 30,
                        'question_count': 5,
                        'randomize': True
                    }
                )
                
                # Create post-assessment
                PostAssessment.objects.get_or_create(
                    course=course,
                    defaults={
                        'is_active': True,
                        'passing_threshold': 80,
                        'max_attempts': 3,
                        'question_count': 10,
                        'randomize': True
                    }
                )
                
                # Create certification
                Certification.objects.get_or_create(
                    course=course,
                    defaults={
                        'template': 'corporate_modern',
                        'enable_soft_expiry': False,
                        'enable_recertification_reminder': True
                    }
                )
            else:
                self.stdout.write(self.style.WARNING(f'⚠️  Course already exists: {course.display_name}'))

        self.stdout.write(self.style.SUCCESS('\n✨ Sample data seeding completed!'))
        self.stdout.write('\n📝 Test Credentials:')
        self.stdout.write('   Admin: admin / admin123')
        self.stdout.write('   Instructor: instructor / instructor123')
        self.stdout.write('   Trainee: trainee / trainee123')
