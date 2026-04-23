from django.core.cache import cache
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ComplianceAlert
from accounts.models import User
from .models import TrainingSession
from .serializers import TrainingSessionSerializer
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
