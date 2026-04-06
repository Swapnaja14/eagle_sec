from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers
from .views import (CourseViewSet, LessonViewSet, LessonFileViewSet,
                    PreAssessmentViewSet, PostAssessmentViewSet, CertificationViewSet)

router = DefaultRouter()
router.register(r'', CourseViewSet, basename='course')

# Nested: /api/courses/{course_pk}/lessons/
courses_router = nested_routers.NestedDefaultRouter(router, r'', lookup='course')
courses_router.register(r'lessons', LessonViewSet, basename='course-lesson')
courses_router.register(r'pre-assessment', PreAssessmentViewSet, basename='course-pre-assessment')
courses_router.register(r'post-assessment', PostAssessmentViewSet, basename='course-post-assessment')
courses_router.register(r'certification', CertificationViewSet, basename='course-certification')

# Nested lessons: /api/courses/{course_pk}/lessons/{lesson_pk}/files/
lessons_router = nested_routers.NestedDefaultRouter(courses_router, r'lessons', lookup='lesson')
lessons_router.register(r'files', LessonFileViewSet, basename='lesson-file')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(courses_router.urls)),
    path('', include(lessons_router.urls)),
]
