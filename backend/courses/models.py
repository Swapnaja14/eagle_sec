from django.db import models
from accounts.models import User, Tenant
from questions.models import Question


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

COURSE_STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('active', 'Active'),
    ('retired', 'Retired'),
]

COMPLIANCE_CHOICES = [
    ('ISO 27001', 'ISO 27001'),
    ('SOC2', 'SOC2'),
    ('GDPR', 'GDPR'),
    ('HIPAA', 'HIPAA'),
    ('PCI-DSS', 'PCI-DSS'),
    ('NIST', 'NIST'),
    ('none', 'None'),
]

SKILL_CHOICES = [
    ('Threat Analysis', 'Threat Analysis'),
    ('Incident Response', 'Incident Response'),
    ('Penetration Testing', 'Penetration Testing'),
    ('Cloud Architecture', 'Cloud Architecture'),
    ('DevSecOps', 'DevSecOps'),
    ('Risk Management', 'Risk Management'),
    ('Python', 'Python'),
    ('Kubernetes', 'Kubernetes'),
    ('none', 'None'),
]

CERT_TEMPLATE_CHOICES = [
    ('corporate_modern', 'Corporate - Modern'),
    ('minimalist_blue', 'Minimalist Blue'),
    ('academic_formal', 'Academic Formal'),
]

MAX_ATTEMPTS_CHOICES = [
    (1, '1 Attempt'),
    (2, '2 Attempts'),
    (3, '3 Attempts'),
    (5, '5 Attempts'),
    (0, 'Unlimited'),
]


class Course(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='courses')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    # Level 1: Global Metadata
    course_id = models.CharField(max_length=50, unique=True, blank=True)
    display_name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    compliance_taxonomy = models.CharField(max_length=50, choices=COMPLIANCE_CHOICES, default='none')
    skills_taxonomy = models.CharField(max_length=50, choices=SKILL_CHOICES, default='none')

    status = models.CharField(max_length=20, choices=COURSE_STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.course_id:
            import uuid
            self.course_id = f"CS-{self.tenant_id or 0}-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.display_name

    class Meta:
        ordering = ['-created_at']


class PreAssessment(models.Model):
    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name='pre_assessment')
    is_active = models.BooleanField(default=True)
    single_attempt = models.BooleanField(default=True)
    time_limit_minutes = models.IntegerField(default=45)
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    question_count = models.IntegerField(default=10)
    randomize = models.BooleanField(default=False)
    questions = models.ManyToManyField(Question, blank=True, related_name='pre_assessments')

    def __str__(self):
        return f"Pre-Assessment for {self.course}"


class Lesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=300)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order}. {self.title}"

    class Meta:
        ordering = ['order']


class LessonFile(models.Model):
    FILE_TYPE_CHOICES = [
        ('video', 'Video'),
        ('document', 'Document'),
        ('presentation', 'Presentation'),
    ]
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='lesson_files/%Y/%m/')
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    allow_offline_download = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_filename


class PostAssessment(models.Model):
    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name='post_assessment')
    is_active = models.BooleanField(default=True)
    passing_threshold = models.IntegerField(default=85)
    max_attempts = models.IntegerField(default=2, choices=MAX_ATTEMPTS_CHOICES)
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    question_count = models.IntegerField(default=10)
    randomize = models.BooleanField(default=False)
    questions = models.ManyToManyField(Question, blank=True, related_name='post_assessments')

    def __str__(self):
        return f"Post-Assessment for {self.course}"


class Certification(models.Model):
    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name='certification')
    template = models.CharField(max_length=30, choices=CERT_TEMPLATE_CHOICES, default='corporate_modern')
    enable_soft_expiry = models.BooleanField(default=False)  # 7-day grace period
    enable_recertification_reminder = models.BooleanField(default=True)  # 30 days before

    def __str__(self):
        return f"Certification for {self.course}"


class BatchExpiry(models.Model):
    certification = models.ForeignKey(Certification, on_delete=models.CASCADE, related_name='batch_expiries')
    target_group = models.CharField(max_length=200)  # e.g. "IT Department (Q3 cohort)"
    expiry_date = models.DateField()
    applied_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.target_group} → {self.expiry_date}"


class TrainingAssignment(models.Model):
    STATUS_ASSIGNED = "assigned"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_OVERDUE = "overdue"
    STATUS_CHOICES = [
        (STATUS_ASSIGNED, "Assigned"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_OVERDUE, "Overdue"),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="training_assignments")
    trainee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="training_assignments",
        limit_choices_to={"role": User.ROLE_TRAINEE},
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="training_assignments")
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_trainings",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ASSIGNED, db_index=True)
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-assigned_at"]
        unique_together = ["trainee", "course"]
        indexes = [
            models.Index(fields=["tenant", "trainee", "status"]),
            models.Index(fields=["tenant", "due_date"]),
        ]

    def __str__(self):
        return f"{self.trainee.username} -> {self.course.display_name} ({self.status})"
