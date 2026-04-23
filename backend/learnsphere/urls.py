from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from accounts.views import CustomTokenObtainPairView
from rest_framework.routers import DefaultRouter
from courses.assignment_views import TrainingAssignmentViewSet

_assignments_router = DefaultRouter()
_assignments_router.register(r'', TrainingAssignmentViewSet, basename='training-assignment')

urlpatterns = [
    # JWT Auth

    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Admin
    path('admin/', admin.site.urls),

    # Core APIs
    path('api/auth/', include('accounts.urls')),
    path('api/content/', include('content.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/questions/', include('questions.urls')),
    path('api/assessments/', include('assessments.urls')),
    path('api/', include('dashboard.urls')),

    path('api/assignments/', include(_assignments_router.urls)),

    # HRM features
    path('api/attendance/', include('attendance.urls')),
    path('api/feedback/', include('feedback.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/certificates/', include('certificates.urls')),
]

# Media files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)    