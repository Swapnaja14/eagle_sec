from django.db import models
from accounts.models import User, Tenant
from assessments.models import Submission
from courses.models import Course


class CertificateTemplate(models.Model):
    """
    Trainer-created certificate templates with full customisation.
    """
    LAYOUT_CHOICES = [
        ("landscape", "Landscape"),
        ("portrait", "Portrait"),
    ]
    THEME_CHOICES = [
        ("corporate_blue",   "Corporate Blue"),
        ("corporate_dark",   "Corporate Dark"),
        ("minimalist",       "Minimalist"),
        ("academic_formal",  "Academic Formal"),
        ("gold_elegant",     "Gold Elegant"),
    ]

    tenant      = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="cert_templates")
    created_by  = models.ForeignKey(User,   on_delete=models.SET_NULL, null=True, related_name="cert_templates")

    # Identity
    title        = models.CharField(max_length=255, help_text="Template name shown in the builder")
    company_name = models.CharField(max_length=200, blank=True)
    company_logo = models.ImageField(upload_to="cert_logos/", null=True, blank=True)

    # Layout & theme
    layout = models.CharField(max_length=20, choices=LAYOUT_CHOICES, default="landscape")
    theme  = models.CharField(max_length=30,  choices=THEME_CHOICES,  default="corporate_blue")

    # Content placeholders (use {{employee_name}}, {{course_name}}, {{date}} in body)
    heading_text    = models.CharField(max_length=300, default="Certificate of Completion")
    sub_heading     = models.CharField(max_length=300, default="This is to certify that")
    body_text       = models.TextField(
        default="has successfully completed the course and demonstrated the required competencies.",
        help_text="Supports {{employee_name}}, {{course_name}}, {{date}} placeholders",
    )
    footer_text     = models.CharField(max_length=500, blank=True, default="")

    # Signature block
    trainer_name       = models.CharField(max_length=150, blank=True)
    trainer_title      = models.CharField(max_length=150, blank=True, default="Authorized Trainer")
    trainer_signature  = models.ImageField(upload_to="cert_signatures/", null=True, blank=True)

    # Validity
    validity_days = models.PositiveIntegerField(
        default=0, help_text="0 = no expiry; >0 = days from issue date"
    )

    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tenant", "is_active"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.tenant})"


class IssuedCertificate(models.Model):
    """
    Tracks a PDF + PNG certificate issued to an employee after passing
    a quiz/assessment for a course.
    """
    tenant     = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="issued_certificates")
    employee   = models.ForeignKey(User,   on_delete=models.CASCADE, related_name="issued_certificates")
    course     = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="issued_certificates")
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name="certificate")
    template   = models.ForeignKey(
        CertificateTemplate, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="issued_certificates",
    )

    # File paths
    pdf_path = models.CharField(max_length=500, blank=True)
    png_path = models.CharField(max_length=500, blank=True)

    # Keep legacy field name for backwards compat
    @property
    def file_path(self):
        return self.pdf_path

    issued_at  = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-issued_at"]
        indexes = [
            models.Index(fields=["employee", "issued_at"]),
            models.Index(fields=["tenant",   "issued_at"]),
        ]

    def __str__(self):
        return f"Cert #{self.id} — {self.employee.username} / {self.course}"
