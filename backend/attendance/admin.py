from django.contrib import admin
from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ["employee", "session", "date", "status", "marked_at"]
    list_filter = ["status", "date", "tenant"]
    search_fields = ["employee__username", "session__topic"]
    ordering = ["-date"]
