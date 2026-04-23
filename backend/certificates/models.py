from django.db import models
from accounts.models import User, Tenant
from assessments.models import Submission
from courses.models import Course


class IssuedCertificate(models.Model):
    """
    Tracks a PDF certificate issued to an employee after passing
    a quiz/assessment for a course.
    """
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="issued_certificates"
    )
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="issued_certificates"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="issued_certificates"
    )
    submission = models.OneToOneField(
        Submission, on_delete=models.CASCADE, related_name="certificate"
    )
    file_path = models.CharField(max_length=500)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-issued_at"]
        indexes = [
            models.Index(fields=["employee", "issued_at"]),
            models.Index(fields=["tenant", "issued_at"]),
        ]

    def __str__(self):
        return f"Cert #{self.id} — {self.employee.username} / {self.course}"
