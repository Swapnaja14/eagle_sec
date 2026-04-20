from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q

from .models import Attendance
from .serializers import AttendanceSerializer


class AttendanceListCreateView(generics.ListCreateAPIView):
    """List all attendance records or mark attendance for a session."""
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "date", "session", "employee"]

    def get_queryset(self):
        user = self.request.user
        qs = Attendance.objects.select_related("employee", "session", "tenant")
        if user.role == "superadmin":
            return qs
        if user.role == "trainee":
            return qs.filter(employee=user)
        return qs.filter(tenant=user.tenant)


class AttendanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a single attendance record."""
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Attendance.objects.select_related("employee", "session")
        if user.role == "superadmin":
            return qs
        if user.role == "trainee":
            return qs.filter(employee=user)
        return qs.filter(tenant=user.tenant)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_summary(request):
    """
    Returns attendance percentage per session for the current tenant.
    Query params: session_id (optional)
    """
    user = request.user
    qs = Attendance.objects.all()
    if user.role != "superadmin":
        qs = qs.filter(tenant=user.tenant)

    session_id = request.query_params.get("session_id")
    if session_id:
        qs = qs.filter(session_id=session_id)

    stats = qs.values("session__id", "session__topic").annotate(
        total=Count("id"),
        present=Count("id", filter=Q(status=Attendance.STATUS_PRESENT)),
        absent=Count("id", filter=Q(status=Attendance.STATUS_ABSENT)),
        late=Count("id", filter=Q(status=Attendance.STATUS_LATE)),
    )

    data = []
    for row in stats:
        total = row["total"] or 0
        present = row["present"] or 0
        data.append({
            "session_id": row["session__id"],
            "session_topic": row["session__topic"],
            "total": total,
            "present": present,
            "absent": row["absent"],
            "late": row["late"],
            "attendance_percentage": round(present / total * 100, 2) if total else 0.0,
        })

    return Response(data)
