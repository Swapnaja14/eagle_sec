from django.db import models
from accounts.models import User


class Permission(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class RolePermission(models.Model):
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('admin', 'Admin'),
        ('instructor', 'Trainer'),
        ('trainee', 'Trainee'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    is_granted = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['role', 'permission']
        ordering = ['role', 'permission']

    def __str__(self):
        return f"{self.role} - {self.permission.code}"
