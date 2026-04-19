from django.db import models
from django.contrib.auth import get_user_model
from courses.models import Course

User = get_user_model()

class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    trainer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements', limit_choices_to={'role__in': ['instructor', 'admin', 'superadmin']})
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class DiscussionThread(models.Model):
    title = models.CharField(max_length=255)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='discussion_threads')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='started_threads')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class Message(models.Model):
    thread = models.ForeignKey(DiscussionThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.first_name} - {self.timestamp}"

    class Meta:
        ordering = ['timestamp']


class AssignmentFeedback(models.Model):
    trainee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_feedback', limit_choices_to={'role': 'trainee'})
    given_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_feedback', limit_choices_to={'role__in': ['instructor', 'admin', 'superadmin']})
    feedback_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.trainee.username} by {self.given_by.username}"

    class Meta:
        ordering = ['-created_at']


class PerformanceRating(models.Model):
    trainee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performance_ratings', limit_choices_to={'role': 'trainee'})
    trainer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_ratings', limit_choices_to={'role__in': ['instructor', 'admin', 'superadmin']})
    rating = models.IntegerField(help_text="Rating from 1 to 5")
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.rating} stars for {self.trainee.username}"

    class Meta:
        ordering = ['-created_at']
