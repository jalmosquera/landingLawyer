"""
Client API serializers.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.clients.models import Client

User = get_user_model()


class ClientSerializer(serializers.ModelSerializer):
    """
    Serializer for Client model with full details.

    Used for listing and retrieving client information.
    Includes computed properties like has_portal_access and active_cases_count.
    """

    has_portal_access = serializers.BooleanField(read_only=True)
    active_cases_count = serializers.IntegerField(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True, allow_null=True)

    class Meta:
        model = Client
        fields = [
            'id',
            'user',
            'user_email',
            'full_name',
            'email',
            'phone',
            'identification_type',
            'identification_number',
            'address',
            'city',
            'state',
            'postal_code',
            'notes',
            'has_portal_access',
            'active_cases_count',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class ClientCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new clients.

    Validates email uniqueness and handles user linking if provided.
    """

    class Meta:
        model = Client
        fields = [
            'user',
            'full_name',
            'email',
            'phone',
            'identification_type',
            'identification_number',
            'address',
            'city',
            'state',
            'postal_code',
            'notes',
        ]

    def validate_email(self, value):
        """Ensure email is unique among clients."""
        if Client.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Ya existe un cliente con este correo electrónico."
            )
        return value

    def validate_user(self, value):
        """Ensure user has client role and is not already linked."""
        if value:
            if value.role != 'client':
                raise serializers.ValidationError(
                    "El usuario debe tener el rol de 'client'."
                )
            if hasattr(value, 'client_profile'):
                raise serializers.ValidationError(
                    "Este usuario ya está vinculado a otro cliente."
                )
        return value

    def create(self, validated_data):
        """Create client and set created_by from request user."""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ClientUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing clients.

    Excludes created_by and allows partial updates.
    """

    class Meta:
        model = Client
        fields = [
            'user',
            'full_name',
            'email',
            'phone',
            'identification_type',
            'identification_number',
            'address',
            'city',
            'state',
            'postal_code',
            'notes',
        ]

    def validate_email(self, value):
        """Ensure email is unique excluding current instance."""
        queryset = Client.objects.filter(email=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                "Ya existe un cliente con este correo electrónico."
            )
        return value

    def validate_user(self, value):
        """Ensure user has client role and is not already linked to another client."""
        if value:
            if value.role != 'client':
                raise serializers.ValidationError(
                    "El usuario debe tener el rol de 'client'."
                )
            # Check if user is linked to a different client
            if hasattr(value, 'client_profile') and value.client_profile != self.instance:
                raise serializers.ValidationError(
                    "Este usuario ya está vinculado a otro cliente."
                )
        return value


class ClientMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal client serializer for nested representations.

    Used in case listings and other relations where full client details aren't needed.
    """

    has_portal_access = serializers.BooleanField(read_only=True)

    class Meta:
        model = Client
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'has_portal_access',
        ]
        read_only_fields = fields
