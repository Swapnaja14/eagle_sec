import os

from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from assessments.models import Submission
from .models import IssuedCertificate
from .serializers import IssuedCertificateSerializer, GenerateCertificateSerializer
from utils.pdf import generate_certificate_pdf


class GenerateCertificateView(APIView):
    """
    POST /api/certificates/generate/
    Generates a PDF certificate if the submission passed.
    Condition: submission.passed == True AND score >= quiz.passing_score
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerateCertificateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission_id = serializer.validated_data["submission_id"]

        # Fetch submission
        try:
            submission = (
                Submission.objects
                .select_related("user", "quiz", "quiz__course")
                .get(id=submission_id)
            )
        except Submission.DoesNotExist:
            return Response({"detail": "Submission not found."}, status=status.HTTP_404_NOT_FOUND)

        # Enforce tenant scope
        if request.user.role != "superadmin":
            if submission.quiz.tenant != request.user.tenant:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Must be completed and passed
        if not submission.passed or submission.status != "completed":
            return Response(
                {"detail": f"Certificate cannot be issued. Score: {submission.percentage:.1f}% "
                           f"(required: {submission.quiz.passing_score}%)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Course must be linked
        course = submission.quiz.course
        if not course:
            return Response(
                {"detail": "This quiz is not linked to a course."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent duplicates
        if IssuedCertificate.objects.filter(submission=submission).exists():
            cert = IssuedCertificate.objects.get(submission=submission)
            return Response(
                IssuedCertificateSerializer(cert, context={"request": request}).data,
                status=status.HTTP_200_OK,
            )

        # Create placeholder certificate record (needed to get the ID for the filename)
        cert = IssuedCertificate(
            tenant=submission.quiz.tenant,
            employee=submission.user,
            course=course,
            submission=submission,
            file_path="",
        )
        cert.save()

        # Generate the PDF now that we have an ID
        employee_name = (
            f"{submission.user.first_name} {submission.user.last_name}".strip()
            or submission.user.username
        )
        completion_date = submission.submitted_at or timezone.now()
        file_path = generate_certificate_pdf(
            employee_name=employee_name,
            course_name=course.display_name,
            completion_date=completion_date,
            certificate_id=cert.id,
        )
        cert.file_path = file_path
        cert.save(update_fields=["file_path"])

        return Response(
            IssuedCertificateSerializer(cert, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class CertificateDetailView(APIView):
    """
    GET /api/certificates/{id}/
    Returns certificate metadata and download URL.
    """
    permission_classes = [IsAuthenticated]

    def _get_cert(self, request, cert_id):
        qs = IssuedCertificate.objects.select_related("employee", "course", "submission")
        if request.user.role != "superadmin":
            qs = qs.filter(tenant=request.user.tenant)
        try:
            return qs.get(id=cert_id)
        except IssuedCertificate.DoesNotExist:
            return None

    def get(self, request, cert_id):
        cert = self._get_cert(request, cert_id)
        if not cert:
            return Response({"detail": "Certificate not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(IssuedCertificateSerializer(cert, context={"request": request}).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def download_certificate(request, cert_id):
    """
    GET /api/certificates/{id}/download/
    Streams the PDF file as a download.
    """
    qs = IssuedCertificate.objects.all()
    
    # Only apply tenant filtering if the user is authenticated.
    # For anonymous users (public links), we allow access by ID.
    if request.user.is_authenticated:
        if request.user.role != "superadmin":
            qs = qs.filter(tenant=request.user.tenant)

    try:
        cert = qs.get(id=cert_id)
    except IssuedCertificate.DoesNotExist:
        raise Http404("Certificate not found.")

    if not os.path.exists(cert.file_path):
        raise Http404("Certificate file not found on disk.")

    return FileResponse(
        open(cert.file_path, "rb"),
        as_attachment=True,
        filename=os.path.basename(cert.file_path),
        content_type="application/pdf",
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_certificates(request, employee_id):
    """
    GET /api/certificates/employee/{id}/
    Lists all certificates for a specific employee.
    """
    qs = IssuedCertificate.objects.filter(employee_id=employee_id).select_related(
        "employee", "course", "submission"
    )
    if request.user.role != "superadmin":
        qs = qs.filter(tenant=request.user.tenant)

    return Response(
        IssuedCertificateSerializer(qs, many=True, context={"request": request}).data
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def auto_generate_course_certificate(request):
    """
    POST /api/certificates/auto-generate/
    Automatically generates a certificate for a trainee after completing all assignments for a course.
    
    Request body:
    {
        "course_id": 1
    }
    """
    course_id = request.data.get('course_id')
    if not course_id:
        return Response(
            {"detail": "course_id is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    # Get the course
    from courses.models import Course, TrainingAssignment
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response(
            {"detail": "Course not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user has a training assignment for this course
    try:
        assignment = TrainingAssignment.objects.get(
            trainee=user,
            course=course
        )
    except TrainingAssignment.DoesNotExist:
        return Response(
            {"detail": "You are not assigned to this course."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if assignment is completed
    if assignment.status != TrainingAssignment.STATUS_COMPLETED:
        return Response(
            {"detail": f"Course not completed yet. Current status: {assignment.status}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if certificate already exists for this course
    existing_cert = IssuedCertificate.objects.filter(
        employee=user,
        course=course
    ).first()
    
    if existing_cert:
        return Response(
            IssuedCertificateSerializer(existing_cert, context={"request": request}).data,
            status=status.HTTP_200_OK
        )
    
    # Find the best submission for post-assessment
    best_submission = None
    if hasattr(course, 'post_assessment') and course.post_assessment:
        best_submission = Submission.objects.filter(
            user=user,
            quiz__course=course,
            status='completed',
            passed=True
        ).order_by('-percentage', '-submitted_at').first()
    
    # Create certificate
    cert = IssuedCertificate(
        tenant=course.tenant,
        employee=user,
        course=course,
        submission=best_submission,
        file_path="",
    )
    cert.save()
    
    # Generate PDF
    employee_name = f"{user.first_name} {user.last_name}".strip() or user.username
    completion_date = assignment.updated_at or timezone.now()
    
    file_path = generate_certificate_pdf(
        employee_name=employee_name,
        course_name=course.display_name,
        completion_date=completion_date,
        certificate_id=cert.id,
    )
    cert.file_path = file_path
    cert.save(update_fields=["file_path"])
    
    return Response(
        IssuedCertificateSerializer(cert, context={"request": request}).data,
        status=status.HTTP_201_CREATED
    )
