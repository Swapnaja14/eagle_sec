from django.contrib import admin
from .models import Question


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question_type', 'language', 'difficulty', 'subject', 'is_active']
    list_filter = ['question_type', 'language', 'difficulty', 'subject', 'is_active']
    search_fields = ['text']
