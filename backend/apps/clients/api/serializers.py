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
    Can automatically create a User account if create_portal_access is True.
    """

    create_portal_access = serializers.BooleanField(write_only=True, required=False, default=False)
    portal_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

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
            'create_portal_access',
            'portal_password',
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

    def validate(self, attrs):
        """Validate that password is provided if create_portal_access is True."""
        create_portal = attrs.get('create_portal_access', False)
        password = attrs.get('portal_password', '')

        if create_portal and not password:
            raise serializers.ValidationError({
                'portal_password': 'La contraseña es requerida para crear acceso al portal.'
            })

        if create_portal and len(password) < 8:
            raise serializers.ValidationError({
                'portal_password': 'La contraseña debe tener al menos 8 caracteres.'
            })

        return attrs

    def create(self, validated_data):
        """Create client and optionally create User account for portal access."""
        create_portal = validated_data.pop('create_portal_access', False)
        portal_password = validated_data.pop('portal_password', None)

        validated_data['created_by'] = self.context['request'].user

        # If user wants to create portal access, create User first
        if create_portal and portal_password:
            # Create username from email (before @)
            username = validated_data['email'].split('@')[0]
            base_username = username
            counter = 1

            # Ensure unique username
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # Create User account
            user = User.objects.create_user(
                username=username,
                email=validated_data['email'],
                password=portal_password,
                name=validated_data['full_name'],
                role='client',
                is_active=True
            )

            validated_data['user'] = user

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
