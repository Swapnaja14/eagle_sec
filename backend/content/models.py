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

DIFFICULTY_CHOICES = [
    ('easy', 'Easy'),
    ('medium', 'Medium'),
    ('hard', 'Hard'),
]

FILE_TYPE_CHOICES = [
    ('video', 'Video'),
    ('document', 'Document'),
    ('presentation', 'Presentation'),
    ('image', 'Image'),
]

STATUS_CHOICES = [
    ('active', 'Active'),
    ('archived', 'Archived'),
    ('processing', 'Processing'),
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


class Tag(models.Model):
    name = models.CharField(max_length=100)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ['name', 'tenant']


class ContentFile(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='content_files')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to='content/%Y/%m/')
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    file_size = models.BigIntegerField(default=0)  # bytes
    version = models.CharField(max_length=20, default='v1.0')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    upload_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Metadata
    title = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)

    # Video specific
    duration = models.CharField(max_length=20, blank=True)  # HH:MM:SS

    # Document specific
    page_count = models.IntegerField(null=True, blank=True)
    permissions = models.CharField(max_length=20, default='view_only',
                                   choices=[('view_only', 'View Only'), ('allow_download', 'Allow Download')])

    # Taxonomy
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES, default='other')
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    tags = models.ManyToManyField(Tag, blank=True)

    def __str__(self):
        return f"{self.original_filename} (v{self.version})"

    class Meta:
        ordering = ['-upload_date']
