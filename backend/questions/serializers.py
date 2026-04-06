from rest_framework import serializers
from .models import Question


class QuestionSerializer(serializers.ModelSerializer):
    language_display = serializers.CharField(source='get_language_display', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    subject_display = serializers.CharField(source='get_subject_display', read_only=True)
    type_display = serializers.CharField(source='get_question_type_display', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'text', 'question_type', 'type_display',
            'language', 'language_display',
            'difficulty', 'difficulty_display',
            'subject', 'subject_display',
            'options', 'correct_answer', 'explanation',
            'points', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
