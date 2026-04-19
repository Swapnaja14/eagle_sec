from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Announcement, DiscussionThread, Message, AssignmentFeedback, PerformanceRating
from .serializers import (
    AnnouncementSerializer, DiscussionThreadSerializer, MessageSerializer,
    AssignmentFeedbackSerializer, PerformanceRatingSerializer
)

class IsTrainerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.role in ['instructor', 'admin', 'superadmin']:
            return True
        return request.method in permissions.SAFE_METHODS

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated, IsTrainerOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(trainer=self.request.user)

class DiscussionThreadViewSet(viewsets.ModelViewSet):
    queryset = DiscussionThread.objects.all()
    serializer_class = DiscussionThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

class AssignmentFeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated, IsTrainerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['instructor', 'admin', 'superadmin']:
            # Trainers see all feedback they've given or all feedback generally
            return AssignmentFeedback.objects.all()
        # Trainees only see feedback given to them
        return AssignmentFeedback.objects.filter(trainee=user)

    def perform_create(self, serializer):
        serializer.save(given_by=self.request.user)

class PerformanceRatingViewSet(viewsets.ModelViewSet):
    serializer_class = PerformanceRatingSerializer
    permission_classes = [permissions.IsAuthenticated, IsTrainerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['instructor', 'admin', 'superadmin']:
            return PerformanceRating.objects.all()
        return PerformanceRating.objects.filter(trainee=user)

    def perform_create(self, serializer):
        serializer.save(trainer=self.request.user)
