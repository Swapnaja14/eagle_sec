from django.core.cache import cache
from django.utils import timezone
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ComplianceAlert
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
    # permission_classes = [IsAuthenticated] # Assuming IsAuthenticated is imported or not strictly enforced here for simplicity

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

