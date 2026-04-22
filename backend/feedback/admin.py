from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ["trainee", "trainer", "session", "rating", "submitted_at"]
    list_filter = ["rating", "tenant"]
    search_fields = ["trainee__username", "trainer__username", "session__topic"]
    ordering = ["-submitted_at"]
