from django.core.cache import cache
from django.utils import timezone
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from assessments.models import Submission, Quiz
from .models import ComplianceAlert, TrainingSession
from .services import (
    get_dashboard_summary,
    get_department_completion,
    get_training_trend,
    get_upcoming_sessions,
    get_compliance_alerts,
    get_recent_training_history,
    get_dashboard_overview,
)


class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) in {"admin", "superadmin"}
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


class TraineeDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        tenant = getattr(user, 'tenant', None)

        # 1. My Training (Recent completed submissions)
        recent_submissions = Submission.objects.filter(
            user=user
        ).select_related('quiz').order_by('-updated_at')[:5]

        my_training = []
        for sub in recent_submissions:
            my_training.append({
                "id": sub.id,
                "module": sub.quiz.title,
                "date": sub.updated_at.strftime("%Y-%m-%d"),
                "score": sub.percentage if sub.status == 'completed' else None,
                "status": "passed" if sub.passed else ("in-progress" if sub.status == "in_progress" else "failed"),
                "certificateReady": sub.passed
            })

        # 2. Upcoming Sessions
        sessions = TrainingSession.objects.filter(
            is_active=True,
            date_time__gte=timezone.now()
        )
        if tenant:
            sessions = sessions.filter(tenant=tenant)
        sessions = sessions.order_by('date_time')[:5]

        upcoming_sessions = []
        for sess in sessions:
            upcoming_sessions.append({
                "id": sess.id,
                "module": sess.topic,
                "date": sess.date_time.strftime("%Y-%m-%d at %I:%M %p"),
                "type": sess.session_type,
                "venue": sess.site if sess.site else "Online"
            })

        # 3. Pending Assessments
        completed_quiz_ids = Submission.objects.filter(
            user=user, status='completed'
        ).values_list('quiz_id', flat=True)
        
        pending_quizzes = Quiz.objects.filter(
            is_active=True
        )
        if tenant:
            pending_quizzes = pending_quizzes.filter(tenant=tenant)
            
        pending_quizzes = pending_quizzes.exclude(id__in=completed_quiz_ids)[:5]

        pending_assessments = []
        for q in pending_quizzes:
            pending_assessments.append({
                "id": q.id,
                "module": q.title,
                "deadline": "N/A",
                "questions": q.quiz_questions.count(),
                "timeLimit": q.time_limit_minutes,
                "attempted": Submission.objects.filter(user=user, quiz=q).exists()
            })

        return Response({
            "user": {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "role": user.role,
                "department": user.department,
            },
            "my_training": my_training,
            "upcoming_sessions": upcoming_sessions,
            "pending_assessments": pending_assessments
        })

