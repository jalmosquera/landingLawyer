"""
Serializers for Users API.
"""

from rest_framework import serializers
from apps.users.models import User, PasswordResetToken


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model with password handling.
    Used for creating and listing users (staff only).
    """
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'name', 'image', 'role', 'is_staff',
            'phone', 'address', 'location', 'province', 'password', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']

    def create(self, validated_data):
        """
        Create a new user with encrypted password.
        """
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        """
        Update user. If password is provided, encrypt it.
        """
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile (used in /me endpoint).
    Read-only for most fields, allows updating contact info.
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'name', 'image', 'role',
            'phone', 'address', 'location', 'province', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'email', 'role', 'date_joined']


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset request.
    Validates email and triggers token generation.
    """
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation.
    Validates token and new password.
    """
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
