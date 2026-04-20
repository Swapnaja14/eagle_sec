from rest_framework import serializers
from .models import IssuedCertificate


class IssuedCertificateSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    course_title = serializers.CharField(source="course.display_name", read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = IssuedCertificate
        fields = [
            "id", "tenant", "employee", "employee_name",
            "course", "course_title", "submission",
            "file_path", "issued_at", "download_url",
        ]
        read_only_fields = ["id", "issued_at", "tenant", "file_path"]

    def get_employee_name(self, obj):
        u = obj.employee
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def get_download_url(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(f"/api/certificates/{obj.id}/download/")
        return f"/api/certificates/{obj.id}/download/"


class GenerateCertificateSerializer(serializers.Serializer):
    submission_id = serializers.IntegerField()
