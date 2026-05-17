from django.core.management.base import BaseCommand
from rbac.models import Permission, RolePermission


class Command(BaseCommand):
    help = 'Seed default permissions and role mappings'

    def handle(self, *args, **options):
        self.stdout.write('Seeding permissions...')

        # Define all permissions
        permissions_data = [
            {'code': 'dashboard', 'name': 'Dashboard', 'category': 'Core'},
            {'code': 'training_history', 'name': 'Training History', 'category': 'Training'},
            {'code': 'psara', 'name': 'PSARA Compliance', 'category': 'Compliance'},
            {'code': 'calendar', 'name': 'Training Calendar', 'category': 'Training'},
            {'code': 'scheduler', 'name': 'Session Scheduler', 'category': 'Training'},
            {'code': 'course_builder', 'name': 'Course Builder', 'category': 'Content'},
            {'code': 'content_hub', 'name': 'Content Hub', 'category': 'Content'},
            {'code': 'question_bank', 'name': 'Question Bank', 'category': 'Assessment'},
            {'code': 'quiz_results', 'name': 'Quiz Results', 'category': 'Assessment'},
            {'code': 'analytics', 'name': 'Analytics Reports', 'category': 'Reports'},
            {'code': 'bulk_export', 'name': 'Bulk Export', 'category': 'Reports'},
            {'code': 'rbac', 'name': 'RBAC Management', 'category': 'Admin'},
            {'code': 'sites', 'name': 'Site Management', 'category': 'Admin'},
            {'code': 'bulk_users', 'name': 'Bulk User Upload', 'category': 'Admin'},
            {'code': 'audit_logs', 'name': 'Audit Logs', 'category': 'Admin'},
        ]

        # Create permissions
        for perm_data in permissions_data:
            perm, created = Permission.objects.get_or_create(
                code=perm_data['code'],
                defaults={
                    'name': perm_data['name'],
                    'category': perm_data['category'],
                }
            )
            if created:
                self.stdout.write(f'  Created permission: {perm.name}')


        # Define default role permissions
        role_permissions = {
            'superadmin': ['dashboard', 'training_history', 'psara', 'calendar', 'scheduler',
                          'course_builder', 'content_hub', 'question_bank', 'quiz_results',
                          'analytics', 'bulk_export', 'rbac', 'sites', 'bulk_users', 'audit_logs'],
            'admin': ['dashboard', 'training_history', 'psara', 'calendar', 'scheduler',
                     'content_hub', 'quiz_results', 'analytics', 'bulk_export',
                     'sites', 'bulk_users'],
            'instructor': ['dashboard', 'calendar', 'scheduler', 'course_builder',
                          'content_hub', 'question_bank', 'quiz_results'],
            'trainee': ['dashboard', 'calendar'],
        }

        # Create role permissions
        for role, perm_codes in role_permissions.items():
            for perm_code in perm_codes:
                try:
                    permission = Permission.objects.get(code=perm_code)
                    role_perm, created = RolePermission.objects.get_or_create(
                        role=role,
                        permission=permission,
                        defaults={'is_granted': True}
                    )
                    if created:
                        self.stdout.write(f'  Granted {perm_code} to {role}')
                except Permission.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'  Permission {perm_code} not found'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded permissions!'))
