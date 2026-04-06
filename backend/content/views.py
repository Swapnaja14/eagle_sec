from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as dj_filters
from .models import ContentFile, Tag
from .serializers import ContentFileSerializer, TagSerializer


class ContentFileFilter(dj_filters.FilterSet):
    status = dj_filters.CharFilter(field_name='status')
    subject = dj_filters.CharFilter(field_name='subject')
    language = dj_filters.CharFilter(field_name='language')
    difficulty = dj_filters.CharFilter(field_name='difficulty')
    file_type = dj_filters.CharFilter(field_name='file_type')

    class Meta:
        model = ContentFile
        fields = ['status', 'subject', 'language', 'difficulty', 'file_type']


class ContentFileViewSet(viewsets.ModelViewSet):
    serializer_class = ContentFileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ContentFileFilter
    search_fields = ['title', 'original_filename', 'description']
    ordering_fields = ['upload_date', 'title', 'file_size']
    ordering = ['-upload_date']

    def get_queryset(self):
        qs = ContentFile.objects.all()
        if self.request.user.tenant:
            qs = qs.filter(tenant=self.request.user.tenant)
        # Archived filter
        show_archived = self.request.query_params.get('show_archived', 'false')
        if show_archived.lower() != 'true':
            qs = qs.exclude(status='archived')
        return qs.select_related('uploaded_by').prefetch_related('tags')

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        file_type = 'document'
        if file_obj:
            name = file_obj.name.lower()
            if any(name.endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.mkv']):
                file_type = 'video'
            elif any(name.endswith(ext) for ext in ['.ppt', '.pptx']):
                file_type = 'presentation'
            elif any(name.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                file_type = 'image'

        serializer.save(
            uploaded_by=self.request.user,
            original_filename=file_obj.name if file_obj else '',
            file_size=file_obj.size if file_obj else 0,
            file_type=file_type,
        )

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        content = self.get_object()
        content.status = 'archived' if content.status == 'active' else 'active'
        content.save()
        return Response({'status': content.status})

    @action(detail=True, methods=['post'])
    def increment_version(self, request, pk=None):
        content = self.get_object()
        parts = content.version.lstrip('v').split('.')
        try:
            parts[-1] = str(int(parts[-1]) + 1)
        except (ValueError, IndexError):
            parts = ['1', '0']
        content.version = 'v' + '.'.join(parts)
        content.save()
        return Response({'version': content.version})


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Tag.objects.all()
        if self.request.user.tenant:
            qs = qs.filter(tenant=self.request.user.tenant)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
