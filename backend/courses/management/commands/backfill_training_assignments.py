from django.core.management.base import BaseCommand

from accounts.models import User
from assessments.models import Submission
from attendance.models import Attendance
from courses.models import Course, TrainingAssignment


class Command(BaseCommand):
    help = "Backfill TrainingAssignment records from existing submissions and attendance."

    def handle(self, *args, **options):
        created = 0
        existing = 0
        skipped = 0

        # Source 1: quiz submissions already tied to a course.
        submission_pairs = (
            Submission.objects.filter(
                quiz__course__isnull=False,
                user__role=User.ROLE_TRAINEE,
            )
            .values_list("user_id", "quiz__course_id")
            .distinct()
        )

        for user_id, course_id in submission_pairs:
            tenant_id = (
                Course.objects.filter(id=course_id).values_list("tenant_id", flat=True).first()
            )
            if not tenant_id:
                skipped += 1
                continue
            obj, was_created = TrainingAssignment.objects.get_or_create(
                trainee_id=user_id,
                course_id=course_id,
                defaults={"tenant_id": tenant_id},
            )
            if was_created:
                created += 1
            else:
                existing += 1

        # Source 2: attendance session topic mapped to course display_name.
        attendance_rows = (
            Attendance.objects.select_related("session").filter(employee__role=User.ROLE_TRAINEE)
            .values_list("employee_id", "tenant_id", "session__topic")
            .distinct()
        )
        for employee_id, tenant_id, topic in attendance_rows:
            if not topic:
                skipped += 1
                continue
            course_ids = Course.objects.filter(
                tenant_id=tenant_id,
                display_name=topic,
            ).values_list("id", flat=True)
            for course_id in course_ids:
                obj, was_created = TrainingAssignment.objects.get_or_create(
                    trainee_id=employee_id,
                    course_id=course_id,
                    defaults={"tenant_id": tenant_id},
                )
                if was_created:
                    created += 1
                else:
                    existing += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Backfill complete. Created={created}, Existing={existing}, Skipped={skipped}"
            )
        )
