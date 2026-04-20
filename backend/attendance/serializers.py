from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    session_topic = serializers.CharField(source="session.topic", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id", "tenant", "employee", "employee_name",
            "session", "session_topic", "date", "status",
            "marked_at", "notes",
        ]
        read_only_fields = ["id", "marked_at", "tenant"]

    def get_employee_name(self, obj):
        u = obj.employee
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def create(self, validated_data):
        validated_data["tenant"] = self.context["request"].user.tenant
        return super().create(validated_data)
