from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Tenant, Site, Client

User = get_user_model()


# =======================
# Tenant Serializer
# =======================
class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'slug', 'logo', 'is_active']


# =======================
# User Serializer
# =======================
class UserSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'department', 'avatar', 'tenant', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# =======================
# Register Serializer
# =======================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    tenant_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'role', 'department', 'tenant_name'
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        tenant_name = validated_data.pop('tenant_name', None)

        tenant = None
        if tenant_name:
            import re
            slug = re.sub(r'[^a-z0-9]+', '-', tenant_name.lower()).strip('-')
            tenant, _ = Tenant.objects.get_or_create(
                slug=slug,
                defaults={'name': tenant_name}
            )

        user = User.objects.create_user(
            tenant=tenant,
            **validated_data
        )
        return user


# =======================
# Site Serializer
# =======================
class SiteSerializer(serializers.ModelSerializer):
    client_id = serializers.IntegerField(
        source='client.id',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Site
        fields = [
            'id', 'name', 'address', 'city', 'state', 'country',
            'postal_code', 'is_active', 'client_id'
        ]


# =======================
# Client Serializer
# =======================
class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'contact_email',
            'contact_phone', 'industry', 'is_active'
        ]


# =======================
# Employee Serializer
# =======================
class EmployeeSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name',
            'last_name', 'email', 'department', 'tenant'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['employee_id'] = instance.username
        data['name'] = f"{instance.first_name} {instance.last_name}".strip() or instance.username
        return data


# =======================
# JWT Serializer (IMPORTANT)
# =======================
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Uses username-based authentication (default Django behavior).
    """
    username_field = "username"