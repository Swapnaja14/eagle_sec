from django.db import models
from accounts.models import Tenant, User


class TrainingSession(models.Model):
    SESSION_TYPE_CHOICES = [
        ("classroom", "Classroom"),
        ("virtual", "Virtual"),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="training_sessions")
    trainer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="training_sessions")
    topic = models.CharField(max_length=255)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default="classroom")
    date_time = models.DateTimeField(db_index=True)
    attendee_count = models.PositiveIntegerField(default=0)
    department = models.CharField(max_length=100, blank=True, db_index=True)
    site = models.CharField(max_length=120, blank=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date_time"]
        indexes = [
            models.Index(fields=["tenant", "date_time"]),
            models.Index(fields=["tenant", "department"]),
            models.Index(fields=["tenant", "site"]),
        ]

    def __str__(self):
        return f"{self.topic} ({self.date_time:%Y-%m-%d %H:%M})"


class ComplianceAlert(models.Model):
    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="compliance_alerts")
    department = models.CharField(max_length=100, blank=True, db_index=True)
    site = models.CharField(max_length=120, blank=True, db_index=True)
    behind_percent = models.DecimalField(max_digits=5, decimal_places=2)
    affected_count = models.PositiveIntegerField(default=0)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="medium", db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    notified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-behind_percent", "-created_at"]
        indexes = [
            models.Index(fields=["tenant", "is_active"]),
            models.Index(fields=["tenant", "department"]),
            models.Index(fields=["tenant", "site"]),
        ]

    def __str__(self):
        location = self.department or self.site or "Unknown scope"
        return f"{location} ({self.behind_percent}% behind)"
