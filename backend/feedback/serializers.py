from rest_framework import serializers
from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    trainee_name = serializers.SerializerMethodField()
    trainer_name = serializers.SerializerMethodField()
    session_topic = serializers.CharField(source="session.topic", read_only=True)

    class Meta:
        model = Feedback
        fields = [
            "id", "tenant", "trainee", "trainee_name",
            "trainer", "trainer_name", "session", "session_topic",
            "rating", "comments", "submitted_at",
        ]
        read_only_fields = ["id", "submitted_at", "tenant"]

    def get_trainee_name(self, obj):
        u = obj.trainee
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def get_trainer_name(self, obj):
        u = obj.trainer
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user.role == "trainee":
            attrs["trainee"] = request.user
        return attrs

    def create(self, validated_data):
        validated_data["tenant"] = self.context["request"].user.tenant
        return super().create(validated_data)
