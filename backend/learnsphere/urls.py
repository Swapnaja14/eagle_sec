from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/content/', include('content.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/questions/', include('questions.urls')),
    path('api/assessments/', include('assessments.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
