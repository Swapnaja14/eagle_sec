"""
Training assignment endpoints.

Routes registered at /api/assignments/ (see learnsphere/urls.py).

- GET  /api/assignments/                       list
- POST /api/assignments/                       create (admin/trainer/superadmin)
- GET  /api/assignments/{id}/                  detail
- POST /api/assignments/{id}/complete/         mark as completed + auto-issue certificate PDF
- GET  /api/assignments/mine/                  list my assignments (trainee)
"""
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from certificates.models import IssuedCertificate
from certificates.serializers import IssuedCertificateSerializer
from utils.pdf import generate_certificate_pdf

from .models import Course, TrainingAssignment


class TrainingAssignmentSerializer(serializers.ModelSerializer):
    trainee_username = serializers.CharField(source="trainee.username", read_only=True)
    trainee_name = serializers.SerializerMethodField()
    course_title = serializers.CharField(source="course.display_name", read_only=True)

    class Meta:
        model = TrainingAssignment
        fields = [
            "id", "tenant", "trainee", "trainee_username", "trainee_name",
            "course", "course_title", "assigned_by", "assigned_at", "due_date",
            "status", "notes", "updated_at",
        ]
        read_only_fields = [
            "id", "tenant", "trainee_username", "trainee_name",
            "course_title", "assigned_by", "assigned_at", "updated_at",
        ]

    def get_trainee_name(self, obj):
        u = obj.trainee
        return f"{u.first_name} {u.last_name}".strip() or u.username


class TrainingAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = TrainingAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = (
            TrainingAssignment.objects
            .select_related("trainee", "course", "assigned_by", "tenant")
            .order_by("-assigned_at")
        )
        if user.role == "superadmin":
            return qs
        # Trainees only see their own; staff see everything in their tenant
        if user.role == "trainee":
            qs = qs.filter(trainee=user)
        if user.tenant_id:
            qs = qs.filter(tenant=user.tenant)
        return qs

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role not in ("superadmin", "admin", "instructor"):
            return Response(
                {"detail": "Only admin/instructor/superadmin can create assignments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        trainee = serializer.validated_data["trainee"]
        course = serializer.validated_data["course"]

        # Enforce tenant consistency: assignment.tenant = trainee.tenant
        tenant = trainee.tenant
        if not tenant:
            return Response(
                {"detail": "Trainee must belong to a tenant."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent duplicates (the model unique_together already enforces, but return a nicer error)
        existing = TrainingAssignment.objects.filter(trainee=trainee, course=course).first()
        if existing:
            return Response(
                self.get_serializer(existing).data,
                status=status.HTTP_200_OK,
            )

        assignment = serializer.save(
            tenant=tenant,
            assigned_by=user,
            status=TrainingAssignment.STATUS_ASSIGNED,
        )
        return Response(
            self.get_serializer(assignment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        qs = self.get_queryset().filter(trainee=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        """
        Mark this assignment as completed and auto-issue a certificate.
        Only the owning trainee (or staff) can complete it.
        """
        assignment = self.get_object()
        user = request.user

        is_owner = assignment.trainee_id == user.id
        is_staff = user.role in ("superadmin", "admin", "instructor")
        if not (is_owner or is_staff):
            return Response(
                {"detail": "You cannot complete someone else's assignment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if assignment.status != TrainingAssignment.STATUS_COMPLETED:
            assignment.status = TrainingAssignment.STATUS_COMPLETED
            assignment.save(update_fields=["status", "updated_at"])

        # Auto-issue certificate (idempotent: one per assignment/course/trainee)
        cert = IssuedCertificate.objects.filter(
            employee=assignment.trainee,
            course=assignment.course,
        ).first()

        if not cert:
            cert = IssuedCertificate.objects.create(
                tenant=assignment.tenant,
                employee=assignment.trainee,
                course=assignment.course,
                submission=None,
                file_path="",
            )
            employee_name = (
                f"{assignment.trainee.first_name} {assignment.trainee.last_name}".strip()
                or assignment.trainee.username
            )
            file_path = generate_certificate_pdf(
                employee_name=employee_name,
                course_name=assignment.course.display_name,
                completion_date=timezone.now(),
                certificate_id=cert.id,
            )
            cert.file_path = file_path
            cert.save(update_fields=["file_path"])

        return Response(
            {
                "assignment": self.get_serializer(assignment).data,
                "certificate": IssuedCertificateSerializer(cert, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )
