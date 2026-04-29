from rest_framework import serializers
from .models import CertificateTemplate, IssuedCertificate


class CertificateTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CertificateTemplate
        fields = [
            "id", "tenant", "created_by", "created_by_name",
            "title", "company_name", "company_logo",
            "layout", "theme",
            "heading_text", "sub_heading", "body_text", "footer_text",
            "trainer_name", "trainer_title", "trainer_signature",
            "validity_days", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "tenant", "created_by", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ""
        u = obj.created_by
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["tenant"]     = request.user.tenant
        validated_data["created_by"] = request.user
        return super().create(validated_data)


class IssuedCertificateSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    course_title  = serializers.CharField(source="course.display_name", read_only=True)
    template_name = serializers.CharField(source="template.title", read_only=True, default="")
    pdf_url       = serializers.SerializerMethodField()
    png_url       = serializers.SerializerMethodField()

    # Legacy compat
    download_url  = serializers.SerializerMethodField()
    file_path     = serializers.SerializerMethodField()

    class Meta:
        model = IssuedCertificate
        fields = [
            "id", "tenant", "employee", "employee_name",
            "course", "course_title", "submission",
            "template", "template_name",
            "pdf_path", "png_path",
            "file_path", "pdf_url", "png_url", "download_url",
            "issued_at", "expires_at",
        ]
        read_only_fields = ["id", "issued_at", "tenant", "pdf_path", "png_path"]

    def get_employee_name(self, obj):
        u = obj.employee
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def _abs(self, request, path):
        if request:
            return request.build_absolute_uri(path)
        return path

    def get_pdf_url(self, obj):
        return self._abs(self.context.get("request"), f"/api/certificates/{obj.id}/download/pdf/")

    def get_png_url(self, obj):
        return self._abs(self.context.get("request"), f"/api/certificates/{obj.id}/download/png/")

    def get_download_url(self, obj):
        return self.get_pdf_url(obj)

    def get_file_path(self, obj):
        return obj.pdf_path


class GenerateCertificateSerializer(serializers.Serializer):
    submission_id = serializers.IntegerField()
    template_id   = serializers.IntegerField(required=False, allow_null=True)
