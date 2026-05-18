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

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response(
                {'detail': 'No file was submitted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Detect file type
        file_type = 'document'
        name = file_obj.name.lower()

        if any(name.endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.mkv']):
            file_type = 'video'

        elif any(name.endswith(ext) for ext in ['.ppt', '.pptx']):
            file_type = 'presentation'

        elif any(name.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif']):
            file_type = 'image'

        # Build normal dictionary manually
        data = {
            'title': request.data.get('title'),
            'description': request.data.get('description'),
            'subject': request.data.get('subject'),
            'language': request.data.get('language'),
            'difficulty': request.data.get('difficulty'),
            'duration': request.data.get('duration') or '00:00:00',
            'permissions': request.data.get('permissions'),

            # convert comma-separated string to list
            'tag_names': [
                tag.strip()
                for tag in request.data.get('tag_names', '').split(',')
                if tag.strip()
            ],

            'original_filename': file_obj.name,
            'file_size': file_obj.size,
            'file_type': file_type,
            'file': file_obj,
        }
        serializer = self.get_serializer(data=data)

        serializer.is_valid(raise_exception=True)

        serializer.save(
            uploaded_by=request.user,
            tenant=request.user.tenant,
        )

        headers = self.get_success_headers(serializer.data)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def perform_create(self, serializer):
        serializer.save(
            uploaded_by=self.request.user,
            tenant=self.request.user.tenant,
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
