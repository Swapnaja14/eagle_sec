from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from accounts.models import User, Tenant
from dashboard.models import TrainingSession


class Feedback(models.Model):
    """Trainee feedback on a trainer for a specific training session."""

    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="feedbacks"
    )
    trainee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="feedbacks_given",
        limit_choices_to={"role": "trainee"},
    )
    trainer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="feedbacks_received",
        limit_choices_to={"role": "instructor"},
    )
    session = models.ForeignKey(
        TrainingSession, on_delete=models.CASCADE, related_name="feedbacks"
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 (poor) to 5 (excellent)",
    )
    comments = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at"]
        unique_together = ["trainee", "session"]
        indexes = [
            models.Index(fields=["trainer", "submitted_at"]),
            models.Index(fields=["tenant", "submitted_at"]),
        ]

    def __str__(self):
        return f"{self.trainee.username} → {self.trainer.username} ({self.rating}★)"
