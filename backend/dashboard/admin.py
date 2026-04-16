from django.contrib import admin
from .models import TrainingSession, ComplianceAlert


@admin.register(TrainingSession)
class TrainingSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "topic", "session_type", "date_time", "attendee_count", "tenant", "is_active")
    list_filter = ("session_type", "is_active", "tenant", "department", "site")
    search_fields = ("topic", "site", "department", "trainer__username", "trainer__first_name", "trainer__last_name")


@admin.register(ComplianceAlert)
class ComplianceAlertAdmin(admin.ModelAdmin):
    list_display = ("id", "department", "site", "behind_percent", "severity", "affected_count", "tenant", "is_active", "notified_at")
    list_filter = ("severity", "is_active", "tenant", "department", "site")
    search_fields = ("department", "site")
