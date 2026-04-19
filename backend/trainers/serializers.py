from rest_framework import serializers
from .models import Announcement, DiscussionThread, Message, AssignmentFeedback, PerformanceRating
from accounts.serializers import UserSerializer


class AnnouncementSerializer(serializers.ModelSerializer):
    trainer_details = UserSerializer(source='trainer', read_only=True)
    
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'trainer', 'trainer_details', 'created_at', 'updated_at']
        read_only_fields = ['id', 'trainer', 'created_at', 'updated_at']

class MessageSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'thread', 'sender', 'sender_details', 'content', 'timestamp']
        read_only_fields = ['id', 'sender', 'timestamp']

class DiscussionThreadSerializer(serializers.ModelSerializer):
    created_by_details = UserSerializer(source='created_by', read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionThread
        fields = ['id', 'title', 'course', 'created_by', 'created_by_details', 'created_at', 'messages', 'message_count']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_message_count(self, obj):
        return obj.messages.count()

class AssignmentFeedbackSerializer(serializers.ModelSerializer):
    trainee_details = UserSerializer(source='trainee', read_only=True)
    given_by_details = UserSerializer(source='given_by', read_only=True)

    class Meta:
        model = AssignmentFeedback
        fields = ['id', 'trainee', 'trainee_details', 'given_by', 'given_by_details', 'feedback_text', 'created_at']
        read_only_fields = ['id', 'given_by', 'created_at']

class PerformanceRatingSerializer(serializers.ModelSerializer):
    trainee_details = UserSerializer(source='trainee', read_only=True)
    trainer_details = UserSerializer(source='trainer', read_only=True)

    class Meta:
        model = PerformanceRating
        fields = ['id', 'trainee', 'trainee_details', 'trainer', 'trainer_details', 'rating', 'remarks', 'created_at']
        read_only_fields = ['id', 'trainer', 'created_at']
