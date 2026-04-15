from django.db import models
from accounts.models import User, Tenant
from courses.models import Course
from questions.models import Question


class Quiz(models.Model):
    """Assessment/Quiz model"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='quizzes')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_quizzes')
    assigned_trainers = models.ManyToManyField(User, related_name='assigned_quizzes', blank=True, limit_choices_to={'role': 'instructor'})
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='quizzes', null=True, blank=True)
    
    # Quiz settings
    time_limit_minutes = models.IntegerField(default=30, help_text="Time limit in minutes")
    passing_score = models.IntegerField(default=70, help_text="Passing score percentage")
    max_attempts = models.IntegerField(default=3, help_text="Maximum attempts allowed (0 for unlimited)")
    randomize_questions = models.BooleanField(default=False)
    show_correct_answers = models.BooleanField(default=True, help_text="Show correct answers after submission")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name_plural = "Quizzes"
        ordering = ['-created_at']


class QuizQuestion(models.Model):
    """Link between Quiz and Questions with ordering"""
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='quiz_questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='quiz_assignments')
    order = models.IntegerField(default=0)
    points = models.IntegerField(default=1, help_text="Points for this question")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quiz.title} - Q{self.order}"

    class Meta:
        ordering = ['order']
        unique_together = ['quiz', 'question']


class Submission(models.Model):
    """User's quiz submission"""
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_submissions')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='submissions')
    
    attempt_number = models.IntegerField(default=1)
    score = models.FloatField(default=0)
    total_points = models.IntegerField(default=0)
    percentage = models.FloatField(default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_taken_seconds = models.IntegerField(null=True, blank=True)
    
    passed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.quiz.title} (Attempt {self.attempt_number})"

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'quiz', 'attempt_number']


class Answer(models.Model):
    """User's answer to a specific question in a submission"""
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    quiz_question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, null=True, blank=True)
    
    selected_answer = models.TextField(blank=True)  # Store answer index or text
    is_correct = models.BooleanField(default=False)
    points_earned = models.FloatField(default=0)
    
    answered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.submission.user.username} - Q{self.question.id}"

    class Meta:
        ordering = ['answered_at']
