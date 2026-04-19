from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnnouncementViewSet, DiscussionThreadViewSet, MessageViewSet,
    AssignmentFeedbackViewSet, PerformanceRatingViewSet
)

router = DefaultRouter()
router.register(r'announcements', AnnouncementViewSet)
router.register(r'threads', DiscussionThreadViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'feedback', AssignmentFeedbackViewSet, basename='feedback')
router.register(r'ratings', PerformanceRatingViewSet, basename='ratings')

urlpatterns = [
    path('', include(router.urls)),
]
