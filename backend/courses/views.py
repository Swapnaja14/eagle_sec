from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction, models
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as dj_filters
from .models import Course, Lesson, LessonFile, PreAssessment, PostAssessment, Certification, BatchExpiry, TrainingAssignment
from .serializers import (CourseSerializer, LessonSerializer, LessonFileSerializer,
                           PreAssessmentSerializer, PostAssessmentSerializer,
                           CertificationSerializer, BatchExpirySerializer)
from accounts.models import User


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
        user = self.request.user
        print(f"[DEBUG] CourseViewSet get_queryset - User: {user.username}, Role: {user.role}, Tenant: {user.tenant}")
        
        # Superadmins see all courses (including those with no tenant)
        if user.role == 'superadmin':
            print(f"[DEBUG] Superadmin - showing all courses")
            return qs.select_related('created_by', 'pre_assessment', 'post_assessment', 'certification') \
                     .prefetch_related('lessons__files')
        
        # Regular users only see courses in their tenant
        if user.tenant:
            qs = qs.filter(tenant=user.tenant)
            print(f"[DEBUG] Filtering by tenant: {user.tenant.id}")
        else:
            # Non-superadmin without tenant sees nothing
            qs = qs.none()
            print(f"[DEBUG] No tenant assigned - showing nothing")
        return qs.select_related('created_by', 'pre_assessment', 'post_assessment', 'certification') \
                 .prefetch_related('lessons__files')

    def update(self, request, *args, **kwargs):
        print(f"[DEBUG] Course update - User: {request.user.username}, Tenant: {request.user.tenant}")
        print(f"[DEBUG] Update data: {request.data}")
        try:
            response = super().update(request, *args, **kwargs)
            print(f"[DEBUG] Update successful: {response.data}")
            return response
        except Exception as e:
            print(f"[DEBUG] Update failed: {str(e)}")
            raise

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

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get course statistics: enrollment count, completion rate, avg score"""
        course = self.get_object()
        
        # Get all training assignments for this course
        assignments = course.training_assignments.all()
        
        total_enrolled = assignments.count()
        completed = assignments.filter(status=TrainingAssignment.STATUS_COMPLETED).count()
        in_progress = assignments.filter(status=TrainingAssignment.STATUS_IN_PROGRESS).count()
        not_started = assignments.filter(status=TrainingAssignment.STATUS_ASSIGNED).count()
        overdue = assignments.filter(status=TrainingAssignment.STATUS_OVERDUE).count()
        
        completion_rate = (completed / total_enrolled * 100) if total_enrolled > 0 else 0
        
        # Calculate average score from post-assessment submissions
        avg_score = None
        if hasattr(course, 'post_assessment'):
            from submissions.models import Submission
            submissions = Submission.objects.filter(
                assessment_type='post',
                assessment_id=course.post_assessment.id
            )
            if submissions.exists():
                avg_score = submissions.filter(score__isnull=False).aggregate(
                    avg=models.Avg('score')
                )['avg']
        
        return Response({
            'total_enrolled': total_enrolled,
            'completed': completed,
            'in_progress': in_progress,
            'not_started': not_started,
            'overdue': overdue,
            'completion_rate': round(completion_rate, 2),
            'average_score': round(avg_score, 2) if avg_score else None,
        })
    
    @action(detail=True, methods=['get'])
    def enrollments(self, request, pk=None):
        """Get list of enrolled trainees with their status"""
        course = self.get_object()
        assignments = course.training_assignments.select_related('trainee').all()
        
        data = []
        for assignment in assignments:
            trainee = assignment.trainee
            data.append({
                'id': assignment.id,
                'trainee_id': trainee.id,
                'trainee_name': trainee.get_full_name() or trainee.username,
                'trainee_email': trainee.email,
                'status': assignment.status,
                'assigned_at': assignment.assigned_at,
                'due_date': assignment.due_date,
                'notes': assignment.notes,
            })
        
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        """Bulk enroll trainees to course"""
        course = self.get_object()
        trainee_ids = request.data.get('trainee_ids', [])
        due_date = request.data.get('due_date')
        notes = request.data.get('notes', '')
        
        if not trainee_ids:
            return Response(
                {'detail': 'trainee_ids is required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        enrolled = []
        errors = []
        
        for trainee_id in trainee_ids:
            try:
                trainee = User.objects.get(id=trainee_id, role=User.ROLE_TRAINEE)
                assignment, created = TrainingAssignment.objects.get_or_create(
                    trainee=trainee,
                    course=course,
                    defaults={
                        'tenant': course.tenant,
                        'assigned_by': request.user,
                        'due_date': due_date,
                        'notes': notes,
                    }
                )
                if created:
                    enrolled.append({
                        'id': assignment.id,
                        'trainee_id': trainee.id,
                        'trainee_name': trainee.get_full_name() or trainee.username,
                    })
            except User.DoesNotExist:
                errors.append(f"Trainee {trainee_id} not found")
            except Exception as e:
                errors.append(str(e))
        
        return Response({
            'enrolled': enrolled,
            'enrolled_count': len(enrolled),
            'errors': errors,
        })
    
    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        original = self.get_object()

        with transaction.atomic():
            lessons = list(original.lessons.prefetch_related('files').all())
            old_pre = getattr(original, 'pre_assessment', None)
            old_post = getattr(original, 'post_assessment', None)
            old_cert = getattr(original, 'certification', None)

            # Clone course
            new_course = Course.objects.create(
                tenant=original.tenant,
                created_by=request.user,
                course_id='',
                display_name=f"Copy of {original.display_name}",
                description=original.description,
                start_date=original.start_date,
                end_date=original.end_date,
                compliance_taxonomy=original.compliance_taxonomy,
                skills_taxonomy=original.skills_taxonomy,
                status='draft',
            )

            # Clone lessons + files
            for lesson in lessons:
                files = list(lesson.files.all())
                new_lesson = Lesson.objects.create(
                    course=new_course, title=lesson.title, order=lesson.order
                )
                for f in files:
                    LessonFile.objects.create(
                        lesson=new_lesson, file=f.file,
                        original_filename=f.original_filename,
                        file_type=f.file_type, language=f.language,
                        allow_offline_download=f.allow_offline_download,
                    )

            # Clone pre-assessment
            if old_pre:
                pre_q = list(old_pre.questions.all())
                new_pre = PreAssessment.objects.create(
                    course=new_course,
                    is_active=old_pre.is_active,
                    single_attempt=old_pre.single_attempt,
                    time_limit_minutes=old_pre.time_limit_minutes,
                    language=old_pre.language,
                    question_count=old_pre.question_count,
                    randomize=old_pre.randomize,
                )
                new_pre.questions.set(pre_q)
            else:
                PreAssessment.objects.create(course=new_course)

            # Clone post-assessment
            if old_post:
                post_q = list(old_post.questions.all())
                new_post = PostAssessment.objects.create(
                    course=new_course,
                    is_active=old_post.is_active,
                    passing_threshold=old_post.passing_threshold,
                    max_attempts=old_post.max_attempts,
                    language=old_post.language,
                    question_count=old_post.question_count,
                    randomize=old_post.randomize,
                )
                new_post.questions.set(post_q)
            else:
                PostAssessment.objects.create(course=new_course)

            # Clone certification
            if old_cert:
                Certification.objects.create(
                    course=new_course,
                    template=old_cert.template,
                    enable_soft_expiry=old_cert.enable_soft_expiry,
                    enable_recertification_reminder=old_cert.enable_recertification_reminder,
                )
            else:
                Certification.objects.create(course=new_course)

        serializer = self.get_serializer(new_course)
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
            if any(name.endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm']):
                file_type = 'video'
            elif any(name.endswith(ext) for ext in ['.ppt', '.pptx']):
                file_type = 'presentation'
            elif any(name.endswith(ext) for ext in ['.pdf']):
                file_type = 'pdf'
            elif any(name.endswith(ext) for ext in ['.doc', '.docx']):
                file_type = 'document'
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
        try:
            obj = PreAssessment.objects.get(course_id=course_pk)
        except PreAssessment.DoesNotExist:
            # Auto-create if missing (shouldn't happen but defensive)
            course = Course.objects.get(pk=course_pk)
            obj = PreAssessment.objects.create(course=course)
        self.check_object_permissions(self.request, obj)
        return obj

    def list(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)


class PostAssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = PostAssessmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_pk = self.kwargs.get('course_pk')
        return PostAssessment.objects.filter(course_id=course_pk)

    def get_object(self):
        course_pk = self.kwargs.get('course_pk')
        try:
            obj = PostAssessment.objects.get(course_id=course_pk)
        except PostAssessment.DoesNotExist:
            course = Course.objects.get(pk=course_pk)
            obj = PostAssessment.objects.create(course=course)
        self.check_object_permissions(self.request, obj)
        return obj

    def list(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)


class CertificationViewSet(viewsets.ModelViewSet):
    serializer_class = CertificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_pk = self.kwargs.get('course_pk')
        return Certification.objects.filter(course_id=course_pk)

    def get_object(self):
        course_pk = self.kwargs.get('course_pk')
        try:
            obj = Certification.objects.get(course_id=course_pk)
        except Certification.DoesNotExist:
            course = Course.objects.get(pk=course_pk)
            obj = Certification.objects.create(course=course)
        self.check_object_permissions(self.request, obj)
        return obj

    def list(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def add_batch_expiry(self, request, course_pk=None):
        try:
            cert = Certification.objects.get(course_id=course_pk)
        except Certification.DoesNotExist:
            return Response({'detail': 'Certification not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = BatchExpirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(certification=cert)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_topics_view(request):
    """Get list of training topics for session scheduling"""
    user = request.user
    
    # Get active and draft courses as training topics (exclude retired)
    if user.tenant:
        courses = Course.objects.filter(tenant=user.tenant, status__in=['active', 'draft'])
    else:
        courses = Course.objects.filter(status__in=['active', 'draft'])
    
    # Extract course names as topics
    course_topics = list(courses.values_list('display_name', flat=True).distinct())
    
    # Default tech training topics (always included)
    default_topics = [
        'Cybersecurity Fundamentals',
        'Network Security & Firewalls',
        'Cloud Security Best Practices',
        'AWS Security Essentials',
        'Azure Security & Identity',
        'Google Cloud Security',
        'SIEM & Security Monitoring',
        'SOC Operations Basics',
        'Incident Response & Forensics',
        'Threat Hunting Techniques',
        'Vulnerability Management',
        'Penetration Testing Basics',
        'Application Security (OWASP Top 10)',
        'API Security',
        'Secure Coding in Python',
        'DevSecOps Pipeline Security',
        'Container Security (Docker/Kubernetes)',
        'Linux Hardening',
        'Identity & Access Management (IAM)',
        'Zero Trust Security Model',
        'Data Privacy & Protection',
        'Endpoint Detection & Response',
        'Email & Phishing Defense',
        'Business Continuity & Disaster Recovery',
    ]
    
    # Combine course topics and default topics, remove duplicates
    all_topics = list(dict.fromkeys(course_topics + default_topics))
    
    return Response(all_topics)
