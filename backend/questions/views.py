from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as dj_filters
from .models import Question


class QuestionFilter(dj_filters.FilterSet):
    language = dj_filters.CharFilter(field_name='language')
    difficulty = dj_filters.CharFilter(field_name='difficulty')
    subject = dj_filters.CharFilter(field_name='subject')
    question_type = dj_filters.CharFilter(field_name='question_type')

    class Meta:
        model = Question
        fields = ['language', 'difficulty', 'subject', 'question_type']


class QuestionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = QuestionFilter
    search_fields = ['text', 'subject']
    ordering_fields = ['created_at', 'difficulty', 'points']
    ordering = ['-created_at']

    def get_serializer_class(self):
        from .serializers import QuestionSerializer
        return QuestionSerializer

    def get_queryset(self):
        qs = Question.objects.filter(is_active=True)
        if self.request.user.tenant:
            qs = qs.filter(tenant=self.request.user.tenant)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )

    @action(detail=False, methods=['get'])
    def by_language(self, request):
        """Quick endpoint to get questions grouped by language count"""
        from django.db.models import Count
        qs = self.get_queryset()
        data = qs.values('language').annotate(count=Count('id')).order_by('language')
        return Response(list(data))
