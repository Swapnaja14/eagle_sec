from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction

from .models import Permission, RolePermission
from .audit_models import RBACChangeLog
from .serializers import (
    PermissionSerializer, 
    RolePermissionSerializer,
    RBACChangeLogSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_permissions_matrix(request):
    """
    GET /api/rbac/matrix/
    Returns the complete permission matrix for all roles.
    """
    # Only superadmin can view RBAC
    if request.user.role != 'superadmin':
        return Response(
            {'detail': 'Only superadmins can access RBAC management.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all permissions
    permissions = Permission.objects.filter(is_active=True)
    
    # Get all role permissions
    role_permissions = RolePermission.objects.select_related('permission').all()
    
    # Build matrix
    roles = ['superadmin', 'admin', 'instructor', 'trainee']
    matrix = {}
    
    for role in roles:
        matrix[role] = {}
        for perm in permissions:
            # Check if there's a specific role permission
            role_perm = role_permissions.filter(role=role, permission=perm).first()
            if role_perm:
                matrix[role][perm.code] = role_perm.is_granted
            else:
                # Default: superadmin has all, others have none
                matrix[role][perm.code] = (role == 'superadmin')
    
    return Response({
        'permissions': PermissionSerializer(permissions, many=True).data,
        'matrix': matrix,
        'roles': roles,
    })



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_permission(request):
    """
    POST /api/rbac/update/
    Update a single role permission.
    Body: { role, permission_code, is_granted, reason }
    """
    # Only superadmin can modify RBAC
    if request.user.role != 'superadmin':
        return Response(
            {'detail': 'Only superadmins can modify RBAC settings.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    role = request.data.get('role')
    permission_code = request.data.get('permission_code')
    is_granted = request.data.get('is_granted')
    reason = request.data.get('reason', '').strip()
    
    # Validate inputs
    if not role or not permission_code or is_granted is None:
        return Response(
            {'detail': 'Missing required fields: role, permission_code, is_granted'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not reason:
        return Response(
            {'detail': 'Reason is required for RBAC changes.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Prevent modifying superadmin permissions
    if role == 'superadmin':
        return Response(
            {'detail': 'Superadmin permissions cannot be modified.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get permission
    try:
        permission = Permission.objects.get(code=permission_code, is_active=True)
    except Permission.DoesNotExist:
        return Response(
            {'detail': f'Permission {permission_code} not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update or create role permission
    with transaction.atomic():
        role_perm, created = RolePermission.objects.get_or_create(
            role=role,
            permission=permission,
            defaults={'is_granted': is_granted}
        )
        
        previous_value = False if created else role_perm.is_granted
        
        if not created:
            role_perm.is_granted = is_granted
            role_perm.save()
        
        # Create audit log
        RBACChangeLog.objects.create(
            changed_by=request.user,
            changed_by_username=request.user.username,
            changed_by_name=f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
            role=role,
            permission=permission,
            permission_code=permission.code,
            permission_name=permission.name,
            previous_value=previous_value,
            new_value=is_granted,
            reason=reason,
        )
    
    return Response({
        'message': 'Permission updated successfully.',
        'role': role,
        'permission': permission.code,
        'is_granted': is_granted,
    })



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_change_history(request):
    """
    GET /api/rbac/history/
    Returns the audit log of RBAC changes.
    Query params: role (optional), limit (default 50)
    """
    # Only superadmin can view RBAC history
    if request.user.role != 'superadmin':
        return Response(
            {'detail': 'Only superadmins can access RBAC history.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get query params
    role_filter = request.query_params.get('role', '')
    limit = int(request.query_params.get('limit', 50))
    
    # Query change logs
    logs = RBACChangeLog.objects.select_related('changed_by', 'permission').all()
    
    if role_filter:
        logs = logs.filter(role=role_filter)
    
    logs = logs[:limit]
    
    serializer = RBACChangeLogSerializer(logs, many=True)
    
    return Response({
        'history': serializer.data,
        'total': logs.count(),
    })
