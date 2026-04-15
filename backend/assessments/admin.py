from django.contrib import admin
from .models import Quiz, QuizQuestion, Submission, Answer


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'time_limit_minutes', 'passing_score', 'is_active', 'created_at']
    list_filter = ['is_active', 'course', 'created_at']
    search_fields = ['title', 'description']


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ['quiz', 'question', 'order', 'points']
    list_filter = ['quiz']
    ordering = ['quiz', 'order']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['user', 'quiz', 'attempt_number', 'score', 'percentage', 'status', 'passed', 'submitted_at']
    list_filter = ['status', 'passed', 'quiz', 'submitted_at']
    search_fields = ['user__username', 'quiz__title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['submission', 'question', 'is_correct', 'points_earned', 'answered_at']
    list_filter = ['is_correct', 'answered_at']
    search_fields = ['submission__user__username', 'question__text']
