import os
from datetime import timedelta

from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from assessments.models import Submission
from .models import CertificateTemplate, IssuedCertificate
from .serializers import (
    CertificateTemplateSerializer,
    IssuedCertificateSerializer,
    GenerateCertificateSerializer,
)
from utils.pdf import generate_certificate_pdf, generate_certificate_png


# ─────────────────────────────────────────────────────────────────────────────
# CERTIFICATE TEMPLATE CRUD
# ─────────────────────────────────────────────────────────────────────────────

class TemplateListCreateView(APIView):
    """
    GET  /api/certificates/templates/          — list trainer's templates
    POST /api/certificates/templates/          — create new template
    """
    permission_classes = [IsAuthenticated]

    def _base_qs(self, request):
        qs = CertificateTemplate.objects.filter(is_active=True)
        if request.user.role == "superadmin":
            return qs
        return qs.filter(tenant=request.user.tenant)

    def get(self, request):
        qs = self._base_qs(request)
        # Instructors only see their own templates
        if request.user.role == "instructor":
            qs = qs.filter(created_by=request.user)
        serializer = CertificateTemplateSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        # Only instructors, admins, superadmins can create templates
        if request.user.role == "trainee":
            return Response({"detail": "Not permitted."}, status=status.HTTP_403_FORBIDDEN)
        serializer = CertificateTemplateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TemplateDetailView(APIView):
    """
    GET    /api/certificates/templates/{id}/   — retrieve
    PUT    /api/certificates/templates/{id}/   — full update
    PATCH  /api/certificates/templates/{id}/   — partial update
    DELETE /api/certificates/templates/{id}/   — soft-delete
    """
    permission_classes = [IsAuthenticated]

    def _get_template(self, request, pk):
        qs = CertificateTemplate.objects.filter(pk=pk, is_active=True)
        if request.user.role != "superadmin":
            qs = qs.filter(tenant=request.user.tenant)
        return qs.first()

    def get(self, request, pk):
        tmpl = self._get_template(request, pk)
        if not tmpl:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CertificateTemplateSerializer(tmpl, context={"request": request}).data)

    def put(self, request, pk):
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        return self._update(request, pk, partial=True)

    def _update(self, request, pk, partial):
        tmpl = self._get_template(request, pk)
        if not tmpl:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        # Only creator, admin, or superadmin can edit
        if request.user.role == "trainee":
            return Response({"detail": "Not permitted."}, status=status.HTTP_403_FORBIDDEN)
        serializer = CertificateTemplateSerializer(
            tmpl, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        tmpl = self._get_template(request, pk)
        if not tmpl:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role == "trainee":
            return Response({"detail": "Not permitted."}, status=status.HTTP_403_FORBIDDEN)
        tmpl.is_active = False
        tmpl.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
# CERTIFICATE GENERATION
# ─────────────────────────────────────────────────────────────────────────────

class GenerateCertificateView(APIView):
    """
    POST /api/certificates/generate/
    Body: { submission_id, template_id? }
    Generates PDF + PNG if the submission passed.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerateCertificateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission_id = serializer.validated_data["submission_id"]
        template_id   = serializer.validated_data.get("template_id")

        # Fetch submission
        try:
            submission = (
                Submission.objects
                .select_related("user", "quiz", "quiz__course")
                .get(id=submission_id)
            )
        except Submission.DoesNotExist:
            return Response({"detail": "Submission not found."}, status=status.HTTP_404_NOT_FOUND)

        # Tenant scope
        if request.user.role != "superadmin":
            if submission.quiz.tenant != request.user.tenant:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Must be completed and passed
        if not submission.passed or submission.status != "completed":
            return Response(
                {"detail": (
                    f"Certificate cannot be issued. "
                    f"Score: {submission.percentage:.1f}% "
                    f"(required: {submission.quiz.passing_score}%)."
                )},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Course must be linked
        course = submission.quiz.course
        if not course:
            return Response(
                {"detail": "This quiz is not linked to a course."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Return existing certificate if already issued
        if IssuedCertificate.objects.filter(submission=submission).exists():
            cert = IssuedCertificate.objects.get(submission=submission)
            return Response(
                IssuedCertificateSerializer(cert, context={"request": request}).data,
                status=status.HTTP_200_OK,
            )

        # Resolve template
        template = None
        if template_id:
            try:
                template = CertificateTemplate.objects.get(
                    id=template_id, is_active=True,
                    tenant=submission.quiz.tenant,
                )
            except CertificateTemplate.DoesNotExist:
                pass  # fall back to default

        # Create placeholder record to get an ID
        cert = IssuedCertificate(
            tenant=submission.quiz.tenant,
            employee=submission.user,
            course=course,
            submission=submission,
            template=template,
            pdf_path="pending",
            png_path="",
        )
        # Set expiry if template has validity_days
        if template and template.validity_days:
            cert.expires_at = timezone.now() + timedelta(days=template.validity_days)
        cert.save()

        # Generate PDF
        employee_name = (
            f"{submission.user.first_name} {submission.user.last_name}".strip()
            or submission.user.username
        )
        completion_date = submission.submitted_at or timezone.now()

        pdf_path = generate_certificate_pdf(
            employee_name=employee_name,
            course_name=course.display_name,
            completion_date=completion_date,
            certificate_id=cert.id,
            template=template,
        )

        # Generate PNG
        png_path = generate_certificate_png(pdf_path, cert.id)

        cert.pdf_path = pdf_path
        cert.png_path = png_path
        cert.save(update_fields=["pdf_path", "png_path"])

        return Response(
            IssuedCertificateSerializer(cert, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# CERTIFICATE RETRIEVAL & DOWNLOAD
# ─────────────────────────────────────────────────────────────────────────────

class CertificateDetailView(APIView):
    """GET /api/certificates/{id}/"""
    permission_classes = [IsAuthenticated]

    def _get_cert(self, request, cert_id):
        qs = IssuedCertificate.objects.select_related("employee", "course", "submission", "template")
        if request.user.role != "superadmin":
            qs = qs.filter(tenant=request.user.tenant)
        return qs.filter(id=cert_id).first()

    def get(self, request, cert_id):
        cert = self._get_cert(request, cert_id)
        if not cert:
            return Response({"detail": "Certificate not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(IssuedCertificateSerializer(cert, context={"request": request}).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_certificate_pdf(request, cert_id):
    """GET /api/certificates/{id}/download/pdf/"""
    qs = IssuedCertificate.objects.all()
    if request.user.role != "superadmin":
        qs = qs.filter(tenant=request.user.tenant)
    cert = qs.filter(id=cert_id).first()
    if not cert:
        raise Http404("Certificate not found.")
    if not cert.pdf_path or not os.path.exists(cert.pdf_path):
        raise Http404("Certificate PDF not found on disk.")
    return FileResponse(
        open(cert.pdf_path, "rb"),
        as_attachment=True,
        filename=os.path.basename(cert.pdf_path),
        content_type="application/pdf",
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_certificate_png(request, cert_id):
    """GET /api/certificates/{id}/download/png/"""
    qs = IssuedCertificate.objects.all()
    if request.user.role != "superadmin":
        qs = qs.filter(tenant=request.user.tenant)
    cert = qs.filter(id=cert_id).first()
    if not cert:
        raise Http404("Certificate not found.")
    if not cert.png_path or not os.path.exists(cert.png_path):
        raise Http404("Certificate PNG not found on disk.")
    return FileResponse(
        open(cert.png_path, "rb"),
        as_attachment=True,
        filename=os.path.basename(cert.png_path),
        content_type="image/png",
    )


# Legacy download alias (PDF)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_certificate(request, cert_id):
    return download_certificate_pdf(request, cert_id)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_certificates(request, employee_id):
    """GET /api/certificates/employee/{id}/"""
    qs = IssuedCertificate.objects.filter(employee_id=employee_id).select_related(
        "employee", "course", "submission", "template"
    )
    if request.user.role != "superadmin":
        qs = qs.filter(tenant=request.user.tenant)
    return Response(
        IssuedCertificateSerializer(qs, many=True, context={"request": request}).data
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_certificates(request):
    """GET /api/certificates/my/ — current user's certificates"""
    qs = IssuedCertificate.objects.filter(
        employee=request.user
    ).select_related("employee", "course", "submission", "template")
    return Response(
        IssuedCertificateSerializer(qs, many=True, context={"request": request}).data
    )
