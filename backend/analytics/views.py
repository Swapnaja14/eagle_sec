import os

from django.http import FileResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from utils.pdf import generate_analytics_report_pdf


class EmployeeProgressView(APIView):
    """
    GET /analytics/employee/{id}
    Returns training completion stats and average assessment score.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, employee_id):
        tenant = None if request.user.role == "superadmin" else request.user.tenant
        data = services.get_employee_progress(employee_id, tenant=tenant)
        if not data:
            return Response(
                {"detail": f"Employee {employee_id} not found or not a trainee."},
                status=404,
            )
        return Response(data)


class TrainerPerformanceView(APIView):
    """
    GET /analytics/trainer/{id}
    Returns average trainee scores and feedback ratings for a trainer.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, trainer_id):
        tenant = None if request.user.role == "superadmin" else request.user.tenant
        data = services.get_trainer_performance(trainer_id, tenant=tenant)
        if not data:
            return Response(
                {"detail": f"Trainer {trainer_id} not found or not an instructor."},
                status=404,
            )
        return Response(data)


class OverallSummaryView(APIView):
    """
    GET /analytics/summary
    Returns platform-wide aggregated stats.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = None if request.user.role == "superadmin" else request.user.tenant
        return Response(services.get_overall_summary(tenant=tenant))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_report(request):
    """
    GET /analytics/report
    Generates and streams a downloadable PDF analytics report.
    """
    tenant = None if request.user.role == "superadmin" else request.user.tenant

    summary = services.get_overall_summary(tenant=tenant)
    employee_progress = services.get_all_employee_progress(tenant=tenant)
    trainer_performance = services.get_all_trainer_performance(tenant=tenant)

    filepath = generate_analytics_report_pdf(
        summary=summary,
        employee_progress=employee_progress,
        trainer_performance=trainer_performance,
    )

    if not os.path.exists(filepath):
        return Response({"detail": "Failed to generate report."}, status=500)

    return FileResponse(
        open(filepath, "rb"),
        as_attachment=True,
        filename=os.path.basename(filepath),
        content_type="application/pdf",
    )


class GapAnalysisView(APIView):
    """
    GET /analytics/gap-analysis/
    Returns skill gap data: required vs current proficiency per course,
    department gap scores, radar data, and summary KPIs.
    Query params: department (optional)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = None if request.user.role == "superadmin" else request.user.tenant
        department = request.query_params.get("department", "")
        data = services.get_gap_analysis(tenant=tenant, department=department)
        return Response(data)
