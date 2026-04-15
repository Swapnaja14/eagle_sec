from django.db import models
from accounts.models import User, Tenant


LANGUAGE_CHOICES = [
    ('en', 'English'),
    ('hi', 'Hindi'),
    ('fr', 'French'),
    ('de', 'German'),
    ('es', 'Spanish'),
    ('zh', 'Chinese'),
    ('ja', 'Japanese'),
    ('ar', 'Arabic'),
]

QUESTION_TYPE_CHOICES = [
    ('mcq', 'Multiple Choice'),
    ('true_false', 'True/False'),
    ('short_answer', 'Short Answer'),
]

DIFFICULTY_CHOICES = [
    ('easy', 'Easy'),
    ('medium', 'Medium'),
    ('hard', 'Hard'),
]

SUBJECT_CHOICES = [
    ('cybersecurity', 'Cybersecurity'),
    ('cloud_computing', 'Cloud Computing'),
    ('devops', 'DevOps'),
    ('data_science', 'Data Science'),
    ('networking', 'Networking'),
    ('software_development', 'Software Development'),
    ('project_management', 'Project Management'),
    ('compliance', 'Compliance'),
    ('ai_ml', 'AI/ML'),
    ('other', 'Other'),
]


class Question(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='questions')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='mcq')
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES, default='other')

    # For MCQ: options stored as JSON list
    options = models.JSONField(default=list, blank=True)
    # Correct answer: index for MCQ, 'true'/'false' for T/F, text for short answer
    correct_answer = models.TextField(blank=True)
    explanation = models.TextField(blank=True)

    points = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.text[:80]} [{self.language}]"

    class Meta:
        ordering = ['-created_at']
