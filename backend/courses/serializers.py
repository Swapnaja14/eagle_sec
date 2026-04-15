from rest_framework import serializers
from .models import (Course, PreAssessment, Lesson, LessonFile,
                      PostAssessment, Certification, BatchExpiry)
from questions.serializers import QuestionSerializer


class LessonFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonFile
        fields = ['id', 'original_filename', 'file', 'file_type',
                  'language', 'allow_offline_download', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class LessonSerializer(serializers.ModelSerializer):
    files = LessonFileSerializer(many=True, read_only=True)
    file_count = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'files', 'file_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_file_count(self, obj):
        return obj.files.count()


class PreAssessmentSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    question_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, source='questions',
        queryset=__import__('questions.models', fromlist=['Question']).Question.objects.all(),
        required=False
    )

    class Meta:
        model = PreAssessment
        fields = [
            'id', 'is_active', 'single_attempt', 'time_limit_minutes',
            'language', 'question_count', 'randomize', 'questions', 'question_ids'
        ]


class PostAssessmentSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    question_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, source='questions',
        queryset=__import__('questions.models', fromlist=['Question']).Question.objects.all(),
        required=False
    )

    class Meta:
        model = PostAssessment
        fields = [
            'id', 'is_active', 'passing_threshold', 'max_attempts',
            'language', 'question_count', 'randomize', 'questions', 'question_ids'
        ]


class BatchExpirySerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchExpiry
        fields = ['id', 'target_group', 'expiry_date', 'applied_at']
        read_only_fields = ['id', 'applied_at']


class CertificationSerializer(serializers.ModelSerializer):
    batch_expiries = BatchExpirySerializer(many=True, read_only=True)

    class Meta:
        model = Certification
        fields = [
            'id', 'template', 'enable_soft_expiry',
            'enable_recertification_reminder', 'batch_expiries'
        ]


class CourseSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    pre_assessment = PreAssessmentSerializer(read_only=True)
    post_assessment = PostAssessmentSerializer(read_only=True)
    certification = CertificationSerializer(read_only=True)
    lesson_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'course_id', 'display_name', 'description',
            'start_date', 'end_date', 'compliance_taxonomy', 'skills_taxonomy',
            'status', 'created_at', 'updated_at',
            'lessons', 'lesson_count', 'pre_assessment', 'post_assessment',
            'certification', 'created_by_name'
        ]
        read_only_fields = ['id', 'course_id', 'created_at', 'updated_at']

    def get_lesson_count(self, obj):
        return obj.lessons.count()

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def create(self, validated_data):
        tenant = self.context['request'].user.tenant
        user = self.context['request'].user
        if not tenant:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'tenant': 'User must belong to a tenant to create courses.'})
        course = Course.objects.create(tenant=tenant, created_by=user, **validated_data)
        # Auto-create assessment and certification stubs
        PreAssessment.objects.create(course=course)
        PostAssessment.objects.create(course=course)
        Certification.objects.create(course=course)
        return course
