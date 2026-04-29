from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import RegisterSerializer, UserSerializer, SiteSerializer, ClientSerializer, EmployeeSerializer
from .models import Site, Client

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(username=request.data.get('username'))
            response.data['user'] = UserSerializer(user).data
        return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    POST /api/auth/logout/
    Blacklist the refresh token to invalidate it.
    Mobile and web clients should also remove tokens from local storage.
    """
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response(
            {'detail': 'Successfully logged out.'},
            status=status.HTTP_200_OK
        )
    except TokenError:
        return Response(
            {'detail': 'Invalid or expired token.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'detail': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


class SiteListCreateView(generics.ListCreateAPIView):
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Site.objects.all()
        return Site.objects.filter(tenant=user.tenant, is_active=True)


class ClientListCreateView(generics.ListCreateAPIView):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Client.objects.all()
        return Client.objects.filter(tenant=user.tenant, is_active=True)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def departments_view(request):
    """GET /api/auth/departments/ — distinct department list for the tenant."""
    user = request.user
    qs = User.objects.exclude(department='').exclude(department__isnull=True)
    if user.role != 'superadmin':
        qs = qs.filter(tenant=user.tenant)
    depts = sorted(set(qs.values_list('department', flat=True)))
    return Response(depts)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employees_view(request):
    """Get list of employees (trainees) for session scheduling"""
    user = request.user
    
    # Filter by tenant unless superadmin
    if user.role == 'superadmin':
        employees = User.objects.filter(role='trainee')
    else:
        employees = User.objects.filter(role='trainee', tenant=user.tenant)
    
    # Filter by search query if provided
    search = request.query_params.get('search', '')
    if search:
        employees = employees.filter(
            models.Q(username__icontains=search) |
            models.Q(first_name__icontains=search) |
            models.Q(last_name__icontains=search) |
            models.Q(email__icontains=search)
        )
    
    # Filter by department if provided
    department = request.query_params.get('department', '')
    if department:
        employees = employees.filter(department__iexact=department)
    
    serializer = EmployeeSerializer(employees, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_history(request, employee_id):
    """
    GET /api/auth/employees/{id}/history/
    Returns complete history for an employee:
    details, attendance records, training sessions, assessment submissions,
    and issued certificates.
    """
    from attendance.models import Attendance
    from assessments.models import Submission
    from certificates.models import IssuedCertificate

    # Scope by tenant unless superadmin
    qs = User.objects.filter(id=employee_id)
    if request.user.role != "superadmin":
        qs = qs.filter(tenant=request.user.tenant)

    try:
        employee = qs.get()
    except User.DoesNotExist:
        return Response({"detail": "Employee not found."}, status=404)

    # Attendance records
    attendances = Attendance.objects.filter(employee=employee).select_related("session").order_by("-date")
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

    # Training sessions (via attendance)
    session_ids = attendances.values_list("session_id", flat=True).distinct()
    from dashboard.models import TrainingSession
    sessions = TrainingSession.objects.filter(id__in=session_ids).select_related("trainer")
    training_data = [
        {
            "id": s.id,
            "topic": s.topic,
            "session_type": s.session_type,
            "status": s.status,
            "date_time": s.date_time,
            "trainer": (
                f"{s.trainer.first_name} {s.trainer.last_name}".strip() or s.trainer.username
            ) if s.trainer else None,
        }
        for s in sessions
    ]

    # Assessment submissions
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
            "course": sub.quiz.course.display_name if sub.quiz.course else None,
            "score": sub.score,
            "percentage": sub.percentage,
            "passed": sub.passed,
            "status": sub.status,
            "attempt_number": sub.attempt_number,
            "submitted_at": sub.submitted_at,
        }
        for sub in submissions
    ]

    # Issued certificates
    certs = IssuedCertificate.objects.filter(employee=employee).select_related("course").order_by("-issued_at")
    cert_data = [
        {
            "id": c.id,
            "course_id": c.course_id,
            "course_title": c.course.display_name,
            "file_path": c.file_path,
            "issued_at": c.issued_at,
            "download_url": request.build_absolute_uri(f"/api/certificates/{c.id}/download/"),
        }
        for c in certs
    ]

    return Response({
        "employee": UserSerializer(employee).data,
        "attendance": attendance_data,
        "trainings": training_data,
        "assessments": assessment_data,
        "certificates": cert_data,
    })

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        print(f"DEBUG: Login attempt for user: {request.data.get('username')}")
        try:
            response = super().post(request, *args, **kwargs)
            print(f"DEBUG: Login successful for user: {request.data.get('username')}")
            return response
        except Exception as e:
            print(f"DEBUG: Login failed for user: {request.data.get('username')}. Error: {str(e)}")
            raise e