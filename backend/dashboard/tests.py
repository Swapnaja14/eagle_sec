from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Tenant, User
from assessments.models import Quiz, Submission
from courses.models import Course, TrainingAssignment


class TraineeCoursesAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name="Tenant A", slug="tenant-a")
        self.trainee = User.objects.create_user(
            username="trainee1",
            password="pass1234",
            role=User.ROLE_TRAINEE,
            tenant=self.tenant,
        )
        self.admin = User.objects.create_user(
            username="admin1",
            password="pass1234",
            role=User.ROLE_ADMIN,
            tenant=self.tenant,
        )
        self.client.force_authenticate(user=self.trainee)
        self.url = "/api/trainee/courses/"

    def _create_course(self, name, *, status="active"):
        return Course.objects.create(
            tenant=self.tenant,
            created_by=self.admin,
            display_name=name,
            status=status,
        )

    def _create_quiz(self, course, title):
        return Quiz.objects.create(
            tenant=self.tenant,
            created_by=self.admin,
            course=course,
            title=title,
            is_active=True,
        )

    def test_assigned_course_appears_and_unassigned_does_not(self):
        assigned_course = self._create_course("Assigned Course")
        unassigned_course = self._create_course("Unassigned Course")

        TrainingAssignment.objects.create(
            tenant=self.tenant,
            trainee=self.trainee,
            course=assigned_course,
            assigned_by=self.admin,
            status=TrainingAssignment.STATUS_ASSIGNED,
        )

        self._create_quiz(assigned_course, "Assigned Quiz")
        self._create_quiz(unassigned_course, "Unassigned Quiz")

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [row["display_name"] for row in response.data["results"]]
        self.assertIn("Assigned Course", names)
        self.assertNotIn("Unassigned Course", names)

    def test_progress_calculation_is_correct(self):
        course = self._create_course("Progress Course")
        quiz1 = self._create_quiz(course, "Quiz 1")
        self._create_quiz(course, "Quiz 2")

        TrainingAssignment.objects.create(
            tenant=self.tenant,
            trainee=self.trainee,
            course=course,
            assigned_by=self.admin,
            status=TrainingAssignment.STATUS_IN_PROGRESS,
        )

        Submission.objects.create(
            user=self.trainee,
            quiz=quiz1,
            attempt_number=1,
            status="completed",
            percentage=80,
            passed=True,
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        progress = response.data["results"][0]["progress"]
        self.assertEqual(progress["completed_quizzes"], 1)
        self.assertEqual(progress["total_quizzes"], 2)
        self.assertEqual(progress["percent"], 50.0)
        self.assertEqual(progress["best_score"], 80.0)

    def test_completion_updates_assignment_status(self):
        course = self._create_course("Complete Course")
        quiz = self._create_quiz(course, "Only Quiz")

        assignment = TrainingAssignment.objects.create(
            tenant=self.tenant,
            trainee=self.trainee,
            course=course,
            assigned_by=self.admin,
            status=TrainingAssignment.STATUS_IN_PROGRESS,
        )

        Submission.objects.create(
            user=self.trainee,
            quiz=quiz,
            attempt_number=1,
            status="completed",
            percentage=95,
            passed=True,
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

        assignment.refresh_from_db()
        self.assertEqual(assignment.status, TrainingAssignment.STATUS_COMPLETED)

    def test_results_are_ordered_by_due_date_then_assigned_at_desc(self):
        course_soon = self._create_course("Due Soon")
        course_later = self._create_course("Due Later")
        course_same_due_old = self._create_course("Same Due Old")
        course_same_due_new = self._create_course("Same Due New")

        for course in [course_soon, course_later, course_same_due_old, course_same_due_new]:
            self._create_quiz(course, f"{course.display_name} Quiz")

        due_soon = timezone.now().date() + timedelta(days=1)
        due_later = timezone.now().date() + timedelta(days=3)
        same_due = timezone.now().date() + timedelta(days=2)

        TrainingAssignment.objects.create(
            tenant=self.tenant,
            trainee=self.trainee,
            course=course_later,
            assigned_by=self.admin,
            due_date=due_later,
            status=TrainingAssignment.STATUS_ASSIGNED,
        )
        old_assignment = TrainingAssignment.objects.create(
            tenant=self.tenant,
            trainee=self.trainee,
            course=course_same_due_old,
            assigned_by=self.admin,
            due_date=same_due,
            status=TrainingAssignment.STATUS_ASSIGNED,
        )
        new_assignment = TrainingAssignment.objects.create(
            tenant=self.tenant,
            trainee=self.trainee,
            course=course_same_due_new,
            assigned_by=self.admin,
            due_date=same_due,
            status=TrainingAssignment.STATUS_ASSIGNED,
        )
        TrainingAssignment.objects.create(
            tenant=self.tenant,
            trainee=self.trainee,
            course=course_soon,
            assigned_by=self.admin,
            due_date=due_soon,
            status=TrainingAssignment.STATUS_ASSIGNED,
        )

        old_assignment.assigned_at = timezone.now() - timedelta(days=2)
        old_assignment.save(update_fields=["assigned_at"])
        new_assignment.assigned_at = timezone.now() - timedelta(days=1)
        new_assignment.save(update_fields=["assigned_at"])

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ordered_names = [row["display_name"] for row in response.data["results"]]
        self.assertEqual(
            ordered_names,
            ["Due Soon", "Same Due New", "Same Due Old", "Due Later"],
        )
