from django.contrib import admin
from .models import CertificateTemplate, IssuedCertificate


@admin.register(CertificateTemplate)
class CertificateTemplateAdmin(admin.ModelAdmin):
    list_display  = ["id", "title", "tenant", "created_by", "theme", "layout", "is_active", "created_at"]
    list_filter   = ["tenant", "theme", "layout", "is_active"]
    search_fields = ["title", "company_name", "trainer_name"]
    ordering      = ["-created_at"]


@admin.register(IssuedCertificate)
class IssuedCertificateAdmin(admin.ModelAdmin):
    list_display  = ["id", "employee", "course", "template", "issued_at", "expires_at"]
    list_filter   = ["tenant", "issued_at"]
    search_fields = ["employee__username", "course__display_name"]
    ordering      = ["-issued_at"]
