from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Feedback
from .serializers import FeedbackSerializer


class FeedbackListCreateView(generics.ListCreateAPIView):
    """List feedback or submit new feedback for a session."""
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["trainer", "session", "rating"]

    def get_queryset(self):
        user = self.request.user
        qs = Feedback.objects.select_related("trainee", "trainer", "session")
        if user.role == "superadmin":
            return qs
        if user.role == "trainee":
            return qs.filter(trainee=user)
        if user.role == "instructor":
            return qs.filter(trainer=user)
        return qs.filter(tenant=user.tenant)


class FeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a single feedback entry."""
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Feedback.objects.select_related("trainee", "trainer", "session")
        if user.role == "superadmin":
            return qs
        if user.role == "trainee":
            return qs.filter(trainee=user)
        return qs.filter(tenant=user.tenant)
