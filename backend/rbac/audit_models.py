from django.db import models
from accounts.models import User
from .models import Permission


class RBACChangeLog(models.Model):
    """
    Audit log for RBAC permission changes.
    Tracks who changed what permission for which role.
    """
    changed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='rbac_changes'
    )
    role = models.CharField(max_length=20)
    permission = models.ForeignKey(
        Permission, 
        on_delete=models.SET_NULL,
        null=True
    )
    permission_code = models.CharField(max_length=50)
    permission_name = models.CharField(max_length=100)
    
    previous_value = models.BooleanField()
    new_value = models.BooleanField()
    
    reason = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Store user info in case user is deleted
    changed_by_username = models.CharField(max_length=150)
    changed_by_name = models.CharField(max_length=200)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return f"{self.role} - {self.permission_code}: {self.previous_value} → {self.new_value}"
