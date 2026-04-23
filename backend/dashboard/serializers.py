from rest_framework import serializers
from .models import TrainingSession


class TrainingSessionSerializer(serializers.ModelSerializer):
    trainer_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TrainingSession
        fields = [
            "id",
            "topic",
            "session_type",
            "status",
            "trainer",
            "trainer_name",
            "date_time",
            "duration_minutes",
            "attendee_count",
            "max_participants",
            "department",
            "site",
            "venue",
            "platform",
            "meeting_link",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "trainer_name"]

    def get_trainer_name(self, obj):
        if not obj.trainer:
            return ""
        return f"{obj.trainer.first_name} {obj.trainer.last_name}".strip() or obj.trainer.username

