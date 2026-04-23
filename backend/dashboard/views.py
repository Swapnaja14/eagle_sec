from django.core.cache import cache
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Count, Max, Q
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ComplianceAlert
from accounts.models import User
from .models import TrainingSession
from .serializers import TrainingSessionSerializer
from courses.models import TrainingAssignment
from assessments.models import Submission
from .services import (
    get_dashboard_summary,
    get_department_completion,
    get_training_trend,
    get_upcoming_sessions,
    get_calendar_sessions,
    get_compliance_alerts,
    get_recent_training_history,
    get_my_training_history,
    get_dashboard_overview,
)


class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) in {"admin", "superadmin"}
        )


class CanManageSessions(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) in {"superadmin", "admin", "instructor"}
        )


class CachedAPIView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]
    cache_ttl = 120
    cache_prefix = "dashboard"

    def _cache_key(self, request):
        qp = "&".join(f"{k}={v}" for k, v in sorted(request.query_params.items()))
        return f"{self.cache_prefix}:{request.user.id}:{qp}"

    def _get_or_compute(self, request, fn):
        key = self._cache_key(request)
        cached = cache.get(key)
        if cached is not None:
            return cached
        data = fn(request.user, request.query_params)
        cache.set(key, data, self.cache_ttl)
        return data


class DashboardSummaryView(CachedAPIView):
    cache_ttl = 120
    cache_prefix = "dashboard:summary"

    def get(self, request):
        return Response(self._get_or_compute(request, get_dashboard_summary))


class DepartmentCompletionView(CachedAPIView):
    cache_ttl = 180
    cache_prefix = "dashboard:department-completion"

    def get(self, request):
        return Response(get_department_completion(request.user, request.query_params))


class TrainingTrendView(CachedAPIView):
    cache_ttl = 180
    cache_prefix = "dashboard:training-trend"

    def get(self, request):
        return Response(self._get_or_compute(request, get_training_trend))


class UpcomingSessionsView(CachedAPIView):
    cache_ttl = 60
    cache_prefix = "dashboard:upcoming-sessions"

    def get(self, request):
        return Response(get_upcoming_sessions(request.user, request.query_params))


class CalendarSessionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_calendar_sessions(request.user, request.query_params))


class SessionListCreateView(APIView):
    permission_classes = [CanManageSessions]

    def get_queryset(self, request):
        qs = TrainingSession.objects.filter(is_active=True).select_related("trainer", "tenant")
        if request.user.role != "superadmin":
            qs = qs.filter(tenant=request.user.tenant)
        elif request.query_params.get("tenant"):
            qs = qs.filter(tenant_id=request.query_params.get("tenant"))
        return qs

    def get(self, request):
        qs = self.get_queryset(request)
        serializer = TrainingSessionSerializer(qs.order_by("date_time"), many=True)
        return Response({"count": len(serializer.data), "results": serializer.data})

    def post(self, request):
        serializer = TrainingSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(tenant=request.user.tenant)
        return Response(serializer.data, status=201)


class SessionDetailView(APIView):
    permission_classes = [CanManageSessions]

    def get_object(self, request, session_id):
        qs = TrainingSession.objects.select_related("trainer", "tenant")
        if request.user.role != "superadmin":
            qs = qs.filter(tenant=request.user.tenant)
        return get_object_or_404(qs, id=session_id)

    def patch(self, request, session_id):
        session = self.get_object(request, session_id)
        serializer = TrainingSessionSerializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, session_id):
        session = self.get_object(request, session_id)
        session.is_active = False
        session.save(update_fields=["is_active", "updated_at"])
        return Response(status=204)


class SessionTrainersView(APIView):
    permission_classes = [CanManageSessions]

    def get(self, request):
        qs = User.objects.filter(role="instructor", is_active=True)
        if request.user.role != "superadmin":
            qs = qs.filter(tenant=request.user.tenant)
        rows = [
            {
                "id": u.id,
                "name": f"{u.first_name} {u.last_name}".strip() or u.username,
                "username": u.username,
            }
            for u in qs.order_by("first_name", "last_name", "username")
        ]
        return Response(rows)


class ComplianceAlertsView(CachedAPIView):
    cache_ttl = 60
    cache_prefix = "dashboard:compliance-alerts"

    def get(self, request):
        return Response(get_compliance_alerts(request.user, request.query_params))


class ComplianceAlertNotifyView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def post(self, request, alert_id):
        qs = ComplianceAlert.objects.filter(id=alert_id, is_active=True)
        if request.user.role != "superadmin":
            qs = qs.filter(tenant=request.user.tenant)
        alert = qs.first()
        if not alert:
            return Response({"detail": "Alert not found."}, status=404)

        alert.notified_at = timezone.now()
        alert.save(update_fields=["notified_at", "updated_at"])
        return Response({"id": alert.id, "notified_at": alert.notified_at.isoformat(), "status": "notified"})


class RecentTrainingHistoryView(CachedAPIView):
    cache_ttl = 60
    cache_prefix = "dashboard:recent-history"

    def get(self, request):
        return Response(get_recent_training_history(request.user, request.query_params))


class DashboardOverviewView(CachedAPIView):
    cache_ttl = 120
    cache_prefix = "dashboard:overview"

    def get(self, request):
        return Response(self._get_or_compute(request, get_dashboard_overview))



class MyTrainingHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_my_training_history(request.user, request.query_params))


class TraineeDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "my_training": [
                { "id": 1, "module": "PSARA Foundation Course", "date": "2026-03-20", "score": 88, "status": "passed", "certificateReady": True },
                { "id": 2, "module": "Fire Safety & Evacuation", "date": "2026-02-14", "score": 92, "status": "passed", "certificateReady": True },
                { "id": 3, "module": "Emergency Response Protocol", "date": "2026-01-30", "score": 74, "status": "passed", "certificateReady": False },
                { "id": 4, "module": "Access Control Procedures", "date": "2026-04-10", "score": None, "status": "in-progress", "certificateReady": False },
            ],
            "upcoming_sessions": [
                { "id": 1, "module": "First Aid & CPR Certification", "date": "2026-04-18 at 10:00 AM", "type": "classroom", "venue": "Mumbai HQ - Hall 2" },
                { "id": 2, "module": "CCTV Operations Mastery", "date": "2026-04-22 at 2:00 PM", "type": "virtual", "venue": "Zoom Link (sent via email)" },
            ],
            "pending_assessments": [
                { "id": 1, "module": "Access Control Procedures", "deadline": "2026-04-20", "questions": 20, "timeLimit": 30, "attempted": False },
                { "id": 2, "module": "Customer Service Excellence", "deadline": "2026-04-25", "questions": 15, "timeLimit": 20, "attempted": False },
            ]
        })


class TraineeCoursesView(APIView):
    permission_classes = [IsAuthenticated]

    def _course_category(self, course):
        if course.compliance_taxonomy and course.compliance_taxonomy != "none":
            return course.compliance_taxonomy
        if course.skills_taxonomy and course.skills_taxonomy != "none":
            return course.skills_taxonomy
        return "General"

    def _recommendation_for(self, progress_percent, best_score, has_upcoming_session):
        if progress_percent < 40:
            return {
                "type": "catch_up",
                "message": "You are behind schedule. Start the next lesson today.",
                "priority": "high",
            }
        if best_score is not None and best_score < 70:
            return {
                "type": "improve_score",
                "message": "Re-attempt quizzes and review weak topics to improve your score.",
                "priority": "high",
            }
        if has_upcoming_session:
            return {
                "type": "session_ready",
                "message": "You have an upcoming session. Revise key lesson material.",
                "priority": "medium",
            }
        if progress_percent >= 100:
            return {
                "type": "next_course",
                "message": "Great work. Start a recommended next course.",
                "priority": "low",
            }
        return {
            "type": "steady_progress",
            "message": "Keep going. Complete the next quiz to stay on track.",
            "priority": "medium",
        }

    def get(self, request):
        user = request.user

        assignment_qs = (
            TrainingAssignment.objects.select_related("course")
            .filter(
                trainee=user,
                course__status="active",
                status__in=[
                    TrainingAssignment.STATUS_ASSIGNED,
                    TrainingAssignment.STATUS_IN_PROGRESS,
                ],
            )
            .annotate(
                lesson_count=Count("course__lessons", distinct=True),
                total_quizzes=Count(
                    "course__quizzes",
                    filter=Q(course__quizzes__is_active=True),
                    distinct=True,
                ),
            )
            .order_by("due_date", "-assigned_at")
        )
        if user.tenant:
            assignment_qs = assignment_qs.filter(tenant=user.tenant)

        assignments = list(assignment_qs)
        assigned_course_ids = [assignment.course_id for assignment in assignments]

        # Aggregate submission stats for progress tracking.
        submissions = Submission.objects.filter(
            user=user,
            quiz__course_id__in=assigned_course_ids,
        ).select_related("quiz", "quiz__course")
        if user.tenant:
            submissions = submissions.filter(quiz__tenant=user.tenant)

        submission_stats = {
            row["quiz__course_id"]: row
            for row in submissions.values("quiz__course_id").annotate(
                completed_quizzes=Count("quiz_id", filter=Q(status="completed"), distinct=True),
                best_score=Max("percentage", filter=Q(status="completed")),
            )
        }

        upcoming_sessions = TrainingSession.objects.filter(
            is_active=True,
            date_time__gte=timezone.now(),
        )
        if user.tenant:
            upcoming_sessions = upcoming_sessions.filter(tenant=user.tenant)
        upcoming_topics = set(upcoming_sessions.values_list("topic", flat=True))

        results = []
        completed_assignment_ids = []
        for assignment in assignments:
            course = assignment.course
            stats = submission_stats.get(course.id, {})
            total_quizzes = assignment.total_quizzes or 0
            completed_quizzes = stats.get("completed_quizzes", 0) or 0
            progress_percent = (
                round((completed_quizzes / total_quizzes) * 100, 1)
                if total_quizzes > 0
                else 0.0
            )
            best_score = stats.get("best_score")

            if progress_percent >= 100:
                completed_assignment_ids.append(assignment.id)
                continue

            has_upcoming_session = course.display_name in upcoming_topics
            recommendation = self._recommendation_for(progress_percent, best_score, has_upcoming_session)

            results.append(
                {
                    "id": course.id,
                    "course_id": course.course_id,
                    "display_name": course.display_name,
                    "description": course.description,
                    "lesson_count": assignment.lesson_count,
                    "status": course.status,
                    "category": self._course_category(course),
                    "progress": {
                        "percent": progress_percent,
                        "completed_quizzes": completed_quizzes,
                        "total_quizzes": total_quizzes,
                        "best_score": round(float(best_score), 1) if best_score is not None else None,
                    },
                    "recommendation": recommendation,
                    "has_upcoming_session": has_upcoming_session,
                    "assignment": {
                        "status": assignment.status,
                        "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
                        "assigned_at": assignment.assigned_at.isoformat(),
                    },
                }
            )

        if completed_assignment_ids:
            TrainingAssignment.objects.filter(id__in=completed_assignment_ids).update(
                status=TrainingAssignment.STATUS_COMPLETED
            )

        results.sort(key=lambda row: (-row["progress"]["percent"], row["display_name"]))
        return Response({"count": len(results), "results": results})