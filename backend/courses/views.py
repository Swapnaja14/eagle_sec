from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as dj_filters
from .models import Course, Lesson, LessonFile, PreAssessment, PostAssessment, Certification, BatchExpiry
from .serializers import (CourseSerializer, LessonSerializer, LessonFileSerializer,
                           PreAssessmentSerializer, PostAssessmentSerializer,
                           CertificationSerializer, BatchExpirySerializer)


class CourseFilter(dj_filters.FilterSet):
    status = dj_filters.CharFilter(field_name='status')
    compliance_taxonomy = dj_filters.CharFilter(field_name='compliance_taxonomy')
    skills_taxonomy = dj_filters.CharFilter(field_name='skills_taxonomy')

    class Meta:
        model = Course
        fields = ['status', 'compliance_taxonomy', 'skills_taxonomy']


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CourseFilter
    search_fields = ['display_name', 'description', 'course_id']
    ordering_fields = ['created_at', 'display_name', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Course.objects.all()
        if self.request.user.tenant:
            qs = qs.filter(tenant=self.request.user.tenant)
        return qs.select_related('created_by', 'pre_assessment', 'post_assessment', 'certification') \
                 .prefetch_related('lessons__files')

    @action(detail=True, methods=['post'])
    def retire(self, request, pk=None):
        course = self.get_object()
        course.status = 'retired'
        course.save()
        return Response({'status': 'retired'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        course = self.get_object()
        course.status = 'active'
        course.save()
        return Response({'status': 'active'})

    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        course = self.get_object()
        lessons = list(course.lessons.prefetch_related('files').all())
        old_pre = getattr(course, 'pre_assessment', None)
        old_post = getattr(course, 'post_assessment', None)
        old_cert = getattr(course, 'certification', None)

        course.pk = None
        course.course_id = ''
        course.display_name = f"Copy of {course.display_name}"
        course.status = 'draft'
        course.save()

        for lesson in lessons:
            files = list(lesson.files.all())
            lesson.pk = None
            lesson.course = course
            lesson.save()
            for f in files:
                f.pk = None
                f.lesson = lesson
                f.save()

        if old_pre:
            pre_q = list(old_pre.questions.all())
            old_pre.pk = None
            old_pre.course = course
            old_pre.save()
            old_pre.questions.set(pre_q)

        if old_post:
            post_q = list(old_post.questions.all())
            old_post.pk = None
            old_post.course = course
            old_post.save()
            old_post.questions.set(post_q)

        if old_cert:
            old_cert.pk = None
            old_cert.course = course
            old_cert.save()

        serializer = self.get_serializer(course)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_pk = self.kwargs.get('course_pk')
        return Lesson.objects.filter(course_id=course_pk).prefetch_related('files')

    def perform_create(self, serializer):
        course_pk = self.kwargs.get('course_pk')
        last_order = Lesson.objects.filter(course_id=course_pk).count()
        serializer.save(course_id=course_pk, order=last_order + 1)

    @action(detail=False, methods=['post'])
    def reorder(self, request, course_pk=None):
        """Reorder lessons: expects [{id: X, order: Y}, ...]"""
        for item in request.data:
            Lesson.objects.filter(id=item['id'], course_id=course_pk).update(order=item['order'])
        return Response({'status': 'reordered'})


class LessonFileViewSet(viewsets.ModelViewSet):
    serializer_class = LessonFileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        lesson_pk = self.kwargs.get('lesson_pk')
        return LessonFile.objects.filter(lesson_id=lesson_pk)

    def perform_create(self, serializer):
        lesson_pk = self.kwargs.get('lesson_pk')
        file_obj = self.request.FILES.get('file')
        file_type = 'document'
        if file_obj:
            name = file_obj.name.lower()
            if any(name.endswith(ext) for ext in ['.mp4', '.mov', '.avi']):
                file_type = 'video'
            elif any(name.endswith(ext) for ext in ['.ppt', '.pptx']):
                file_type = 'presentation'
        serializer.save(
            lesson_id=lesson_pk,
            original_filename=file_obj.name if file_obj else '',
            file_type=file_type,
        )


class PreAssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = PreAssessmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_pk = self.kwargs.get('course_pk')
        return PreAssessment.objects.filter(course_id=course_pk)

    def get_object(self):
        course_pk = self.kwargs.get('course_pk')
        return PreAssessment.objects.get(course_id=course_pk)


class PostAssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = PostAssessmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_pk = self.kwargs.get('course_pk')
        return PostAssessment.objects.filter(course_id=course_pk)

    def get_object(self):
        course_pk = self.kwargs.get('course_pk')
        return PostAssessment.objects.get(course_id=course_pk)


class CertificationViewSet(viewsets.ModelViewSet):
    serializer_class = CertificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_pk = self.kwargs.get('course_pk')
        return Certification.objects.filter(course_id=course_pk)

    def get_object(self):
        course_pk = self.kwargs.get('course_pk')
        return Certification.objects.get(course_id=course_pk)

    @action(detail=False, methods=['post'])
    def add_batch_expiry(self, request, course_pk=None):
        cert = Certification.objects.get(course_id=course_pk)
        serializer = BatchExpirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(certification=cert)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
