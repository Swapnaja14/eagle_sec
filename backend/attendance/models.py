from django.db import models
from accounts.models import User, Tenant
from dashboard.models import TrainingSession


class Attendance(models.Model):
    STATUS_PRESENT = "present"
    STATUS_ABSENT = "absent"
    STATUS_LATE = "late"
    STATUS_CHOICES = [
        (STATUS_PRESENT, "Present"),
        (STATUS_ABSENT, "Absent"),
        (STATUS_LATE, "Late"),
    ]

    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="attendances"
    )
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="attendances",
        limit_choices_to={"role": "trainee"},
    )
    session = models.ForeignKey(
        TrainingSession, on_delete=models.CASCADE, related_name="attendances"
    )
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PRESENT, db_index=True)
    marked_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-date"]
        unique_together = ["employee", "session", "date"]
        indexes = [
            models.Index(fields=["tenant", "date"]),
            models.Index(fields=["employee", "date"]),
        ]

    def __str__(self):
        return f"{self.employee.username} — {self.session.topic} ({self.date}) [{self.status}]"
