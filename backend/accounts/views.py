from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from django.contrib.auth import get_user_model
from django.db import models
from django.http import HttpResponse

from django_filters.rest_framework import DjangoFilterBackend

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    SiteSerializer,
    ClientSerializer,
    EmployeeSerializer,
    RolePermissionSerializer,
    RBACChangeLogSerializer,
    BulkUserUploadSerializer,
    CustomTokenObtainPairSerializer,
)

from .models import (
    Site,
    Client,
    RolePermission,
    RBACChangeLog,
    Tenant,
)

from . import bulk_upload

import csv
import io

User = get_user_model()


# =========================
# AUTH
# =========================

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        print(f"DEBUG: Login attempt for user: {request.data.get('username')}")

        try:
            response = super().post(request, *args, **kwargs)

            if response.status_code == 200:
                user = User.objects.get(
                    username=request.data.get("username")
                )
                response.data["user"] = UserSerializer(user).data

            print(f"DEBUG: Login successful for user: {request.data.get('username')}")

            return response

        except Exception as e:
            print(
                f"DEBUG: Login failed for user: "
                f"{request.data.get('username')}. Error: {str(e)}"
            )
            raise e


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    serializer = UserSerializer(
        request.user,
        data=request.data,
        partial=True,
    )

    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    POST /api/auth/logout/
    Blacklist the refresh token.
    """

    try:
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token = RefreshToken(refresh_token)
        token.blacklist()

        return Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_200_OK,
        )

    except TokenError:
        return Response(
            {"detail": "Invalid or expired token."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


# =========================
# SITES
# =========================

class SiteListCreateView(generics.ListCreateAPIView):
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["is_active"]

    def get_queryset(self):
        user = self.request.user

        if user.role == "superadmin":
            return Site.objects.all()

        return Site.objects.filter(
            tenant=user.tenant,
            is_active=True,
        )

    def perform_create(self, serializer):
        tenant = (
            None
            if self.request.user.role == "superadmin"
            else self.request.user.tenant
        )

        serializer.save(tenant=tenant)


class SiteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "superadmin":
            return Site.objects.all()

        return Site.objects.filter(tenant=user.tenant)


# =========================
# CLIENTS
# =========================

class ClientListCreateView(generics.ListCreateAPIView):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["is_active"]

    def get_queryset(self):
        user = self.request.user

        if user.role == "superadmin":
            return Client.objects.all()

        return Client.objects.filter(
            tenant=user.tenant,
            is_active=True,
        )

    def perform_create(self, serializer):
        tenant = (
            None
            if self.request.user.role == "superadmin"
            else self.request.user.tenant
        )

        serializer.save(tenant=tenant)


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "superadmin":
            return Client.objects.all()

        return Client.objects.filter(tenant=user.tenant)


# =========================
# DEPARTMENTS
# =========================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def departments_view(request):
    """
    GET /api/auth/departments/
    """

    user = request.user

    qs = User.objects.exclude(
        department=""
    ).exclude(
        department__isnull=True
    )

    if user.role != "superadmin":
        qs = qs.filter(tenant=user.tenant)

    departments = sorted(
        set(qs.values_list("department", flat=True))
    )

    return Response(departments)


# =========================
# EMPLOYEES
# =========================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employees_view(request):
    """
    Get list of employees (trainees)
    """

    user = request.user

    if user.role == "superadmin":
        employees = User.objects.filter(role="trainee")
    else:
        employees = User.objects.filter(
            role="trainee",
            tenant=user.tenant,
        )

    search = request.query_params.get("search", "")

    if search:
        employees = employees.filter(
            models.Q(username__icontains=search)
            | models.Q(first_name__icontains=search)
            | models.Q(last_name__icontains=search)
            | models.Q(email__icontains=search)
        )

    department = request.query_params.get("department", "")

    if department:
        employees = employees.filter(
            department__iexact=department
        )

    serializer = EmployeeSerializer(employees, many=True)

    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_history(request, employee_id):
    """
    GET /api/auth/employees/{id}/history/
    """

    from attendance.models import Attendance
    from assessments.models import Submission
    from certificates.models import IssuedCertificate
    from dashboard.models import TrainingSession

    qs = User.objects.filter(id=employee_id)

    if request.user.role != "superadmin":
        qs = qs.filter(tenant=request.user.tenant)

    try:
        employee = qs.get()

    except User.DoesNotExist:
        return Response(
            {"detail": "Employee not found."},
            status=404,
        )

    # Attendance
    attendances = (
        Attendance.objects.filter(employee=employee)
        .select_related("session")
        .order_by("-date")
    )

    attendance_data = [
        {
            "id": a.id,
            "session_id": a.session_id,
            "session_topic": a.session.topic,
            "date": a.date,
            "status": a.status,
            "marked_at": a.marked_at,
        }
        for a in attendances
    ]

    # Trainings
    session_ids = attendances.values_list(
        "session_id",
        flat=True,
    ).distinct()

    sessions = (
        TrainingSession.objects.filter(id__in=session_ids)
        .select_related("trainer")
    )

    training_data = [
        {
            "id": s.id,
            "topic": s.topic,
            "session_type": s.session_type,
            "status": s.status,
            "date_time": s.date_time,
            "trainer": (
                f"{s.trainer.first_name} {s.trainer.last_name}".strip()
                or s.trainer.username
            )
            if s.trainer
            else None,
        }
        for s in sessions
    ]

    # Assessments
    submissions = (
        Submission.objects.filter(user=employee)
        .select_related("quiz", "quiz__course")
        .order_by("-created_at")
    )

    assessment_data = [
        {
            "id": sub.id,
            "quiz_id": sub.quiz_id,
            "quiz_title": sub.quiz.title,
            "course": (
                sub.quiz.course.display_name
                if sub.quiz.course
                else None
            ),
            "score": sub.score,
            "percentage": sub.percentage,
            "passed": sub.passed,
            "status": sub.status,
            "attempt_number": sub.attempt_number,
            "submitted_at": sub.submitted_at,
        }
        for sub in submissions
    ]

    # Certificates
    certs = (
        IssuedCertificate.objects.filter(employee=employee)
        .select_related("course")
        .order_by("-issued_at")
    )

    cert_data = [
        {
            "id": c.id,
            "course_id": c.course_id,
            "course_title": c.course.display_name,
            "file_path": c.file_path,
            "issued_at": c.issued_at,
            "download_url": request.build_absolute_uri(
                f"/api/certificates/{c.id}/download/"
            ),
        }
        for c in certs
    ]

    return Response(
        {
            "employee": UserSerializer(employee).data,
            "attendance": attendance_data,
            "trainings": training_data,
            "assessments": assessment_data,
            "certificates": cert_data,
        }
    )


# =========================
# RBAC
# =========================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def rbac_list_view(request):
    user = request.user

    if user.role not in ["superadmin", "admin"]:
        return Response(
            status=status.HTTP_403_FORBIDDEN
        )

    permissions = RolePermission.objects.filter(
        tenant=user.tenant
    )

    serializer = RolePermissionSerializer(
        permissions,
        many=True,
    )

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def rbac_update_view(request):
    user = request.user

    if user.role != "superadmin":
        return Response(
            {"detail": "Only Super Admin can modify RBAC."},
            status=status.HTTP_403_FORBIDDEN,
        )

    role = request.data.get("role")
    module_id = request.data.get("module_id")
    has_access = request.data.get("has_access")
    reason = request.data.get("reason")

    if role == "Super Admin":
        return Response(
            {
                "detail": (
                    "Super Admin permissions "
                    "cannot be modified."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    perm, created = RolePermission.objects.get_or_create(
        tenant=user.tenant,
        role=role,
        module_id=module_id,
    )

    from_access = perm.has_access

    perm.has_access = has_access
    perm.save()

    RBACChangeLog.objects.create(
        tenant=user.tenant,
        changed_by=user,
        role_affected=role,
        module_name=module_id,
        from_access=from_access,
        to_access=has_access,
        reason=reason,
    )

    return Response(
        {"detail": "Permission updated successfully."}
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def rbac_history_view(request):
    user = request.user

    if user.role not in ["superadmin", "admin"]:
        return Response(
            status=status.HTTP_403_FORBIDDEN
        )

    logs = (
        RBACChangeLog.objects.filter(
            tenant=user.tenant
        ).order_by("-timestamp")
    )

    serializer = RBACChangeLogSerializer(
        logs,
        many=True,
    )

    return Response(serializer.data)


# =========================
# BULK USER UPLOAD
# =========================

class BulkUserUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):

        if request.user.role not in ["superadmin", "admin"]:
            return Response(
                status=status.HTTP_403_FORBIDDEN
            )

        file_obj = request.data.get("file")

        if not file_obj:
            return Response(
                {"error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            decoded_file = file_obj.read().decode("utf-8-sig")

            io_string = io.StringIO(decoded_file)

            reader = csv.DictReader(io_string)

            created_count = 0
            errors = []

            for index, row in enumerate(reader):

                try:
                    username = row.get("Employee ID")
                    email = row.get("Email", "")

                    if not username:
                        errors.append(
                            f"Row {index + 1}: Employee ID missing"
                        )
                        continue

                    if User.objects.filter(
                        username=username
                    ).exists():
                        errors.append(
                            f"Row {index + 1}: "
                            f"Duplicate Employee ID {username}"
                        )
                        continue

                    User.objects.create_user(
                        username=username,
                        email=email,
                        first_name=row.get("First Name", ""),
                        last_name=row.get("Last Name", ""),
                        department=row.get("Department", ""),
                        role=row.get(
                            "Role",
                            "trainee",
                        ).lower(),
                        tenant=request.user.tenant,
                        password="ChangeMe123!",
                    )

                    created_count += 1

                except Exception as e:
                    errors.append(
                        f"Row {index + 1}: {str(e)}"
                    )

            return Response(
                {
                    "message": (
                        f"Processed "
                        f"{created_count} users successfully."
                    ),
                    "created_count": created_count,
                    "errors": errors,
                }
            )

        except Exception as e:
            return Response(
                {
                    "error": (
                        f"Failed to process file: {str(e)}"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bulk_upload_preview(request):
    """
    POST /api/auth/bulk-upload/preview/
    """

    if request.user.role not in ["admin", "superadmin"]:
        return Response(
            {
                "detail": (
                    "Only admins can perform "
                    "bulk user uploads."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    file = request.FILES.get("file")

    if not file:
        return Response(
            {"detail": "No file provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    file_name = file.name.lower()

    if not (
        file_name.endswith(".csv")
        or file_name.endswith(".xlsx")
    ):
        return Response(
            {
                "detail": (
                    "Invalid file format. "
                    "Only CSV and XLSX files "
                    "are supported."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    tenant = (
        None
        if request.user.role == "superadmin"
        else request.user.tenant
    )

    try:
        file_content = file.read()

        if file_name.endswith(".csv"):
            validated_rows, errors = (
                bulk_upload.parse_csv_file(
                    file_content,
                    tenant,
                )
            )
        else:
            validated_rows, errors = (
                bulk_upload.parse_excel_file(
                    file_content,
                    tenant,
                )
            )

        if errors:
            return Response(
                {
                    "detail": errors[0],
                    "errors": errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_count = sum(
            1
            for row in validated_rows
            if row["status"] == "valid"
        )

        error_count = sum(
            1
            for row in validated_rows
            if row["status"] == "error"
        )

        return Response(
            {
                "preview": validated_rows,
                "total_rows": len(validated_rows),
                "valid_count": valid_count,
                "error_count": error_count,
                "file_name": file.name,
            }
        )

    except Exception as e:
        return Response(
            {
                "detail": (
                    f"Error processing file: {str(e)}"
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bulk_upload_create(request):
    """
    POST /api/auth/bulk-upload/create/
    """

    if request.user.role not in ["admin", "superadmin"]:
        return Response(
            {
                "detail": (
                    "Only admins can perform "
                    "bulk user uploads."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    validated_rows = request.data.get(
        "validated_rows",
        [],
    )

    if not validated_rows:
        return Response(
            {"detail": "No validated rows provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    tenant = (
        None
        if request.user.role == "superadmin"
        else request.user.tenant
    )

    try:
        result = bulk_upload.bulk_create_users(
            validated_rows,
            tenant,
        )

        return Response(
            {
                "created_count": result["created_count"],
                "skipped_count": result["skipped_count"],
                "errors": result["errors"],
                "message": (
                    f"Successfully created "
                    f"{result['created_count']} users. "
                    f"{result['skipped_count']} rows were skipped."
                ),
            }
        )

    except Exception as e:
        return Response(
            {
                "detail": (
                    f"Error creating users: {str(e)}"
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bulk_upload_template(request):
    """
    GET /api/auth/bulk-upload/template/
    """

    response = HttpResponse(
        content_type="text/csv"
    )

    response[
        "Content-Disposition"
    ] = 'attachment; filename="bulk_user_upload_template.csv"'

    writer = csv.writer(response)

    writer.writerow(
        [
            "Employee ID",
            "First Name",
            "Last Name",
            "Email",
            "Department",
            "Designation",
            "Client",
            "Site",
            "Role",
        ]
    )

    writer.writerow(
        [
            "EMP-20001",
            "John",
            "Doe",
            "john.doe@example.com",
            "Security",
            "Guard",
            "SecureGuard India",
            "Mumbai HQ",
            "trainee",
        ]
    )

    writer.writerow(
        [
            "EMP-20002",
            "Jane",
            "Smith",
            "jane.smith@example.com",
            "Training",
            "Trainer",
            "SecureGuard India",
            "Delhi Office",
            "trainer",
        ]
    )

    return response