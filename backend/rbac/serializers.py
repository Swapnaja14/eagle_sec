from rest_framework import serializers
from .models import Permission, RolePermission
from .audit_models import RBACChangeLog


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'code', 'name', 'description', 'category', 'is_active']


class RolePermissionSerializer(serializers.ModelSerializer):
    permission_code = serializers.CharField(source='permission.code', read_only=True)
    permission_name = serializers.CharField(source='permission.name', read_only=True)
    
    class Meta:
        model = RolePermission
        fields = ['id', 'role', 'permission', 'permission_code', 'permission_name', 'is_granted']


class RBACChangeLogSerializer(serializers.ModelSerializer):
    changed_by_display = serializers.SerializerMethodField()
    
    class Meta:
        model = RBACChangeLog
        fields = [
            'id', 'changed_by', 'changed_by_display', 'changed_by_username',
            'changed_by_name', 'role', 'permission_code', 'permission_name',
            'previous_value', 'new_value', 'reason', 'timestamp'
        ]
    
    def get_changed_by_display(self, obj):
        if obj.changed_by:
            return f"{obj.changed_by.first_name} {obj.changed_by.last_name}".strip() or obj.changed_by.username
        return obj.changed_by_username
