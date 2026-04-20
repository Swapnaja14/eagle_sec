from django.contrib import admin
from .models import IssuedCertificate


@admin.register(IssuedCertificate)
class IssuedCertificateAdmin(admin.ModelAdmin):
    list_display = ["id", "employee", "course", "issued_at"]
    list_filter = ["tenant", "issued_at"]
    search_fields = ["employee__username", "course__display_name"]
    ordering = ["-issued_at"]
