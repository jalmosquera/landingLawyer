"""
Landing API serializers.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.landing.models import Service, Testimonial, SuccessCase, ContactRequest

User = get_user_model()


class ServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Service model.

    Used for displaying law firm services on the landing page.
    """

    class Meta:
        model = Service
        fields = [
            'id',
            'title',
            'description',
            'icon',
            'order',
            'is_active',
        ]
        read_only_fields = ['id']


class TestimonialSerializer(serializers.ModelSerializer):
    """
    Serializer for Testimonial model.

    Displays client testimonials with ratings.
    """

    rating_display = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = [
            'id',
            'client_name',
            'text',
            'rating',
            'rating_display',
            'date',
            'order',
            'is_active',
        ]
        read_only_fields = ['id']

    def get_rating_display(self, obj):
        """Return star representation of rating."""
        return '★' * obj.rating + '☆' * (5 - obj.rating)


class SuccessCaseSerializer(serializers.ModelSerializer):
    """
    Serializer for SuccessCase model.

    Showcases law firm victories and successful cases.
    """

    class Meta:
        model = SuccessCase
        fields = [
            'id',
            'title',
            'description',
            'case_type',
            'result',
            'date',
            'order',
            'is_active',
        ]
        read_only_fields = ['id']


class ContactRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for ContactRequest model.

    Handles contact form submissions from the landing page.
    """

    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True, allow_null=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ContactRequest
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'subject',
            'message',
            'request_type',
            'request_type_display',
            'status',
            'status_display',
            'assigned_to',
            'assigned_to_name',
            'internal_notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'status', 'assigned_to', 'internal_notes']


class PublicContactRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for public contact form submissions.

    Used when visitors submit the contact form without authentication.
    Only includes fields visible to the public.
    """

    class Meta:
        model = ContactRequest
        fields = [
            'name',
            'email',
            'phone',
            'subject',
            'message',
            'request_type',
        ]

    def validate_email(self, value):
        """Basic email validation."""
        if not value or '@' not in value:
            raise serializers.ValidationError("Por favor ingresa un correo electrónico válido.")
        return value.lower()

    def validate_phone(self, value):
        """Basic phone validation."""
        # Remove spaces and dashes
        cleaned = ''.join(filter(str.isdigit, value))
        if len(cleaned) < 10:
            raise serializers.ValidationError("Por favor ingresa un número de teléfono válido.")
        return value

    def create(self, validated_data):
        """Create contact request with default status."""
        validated_data['status'] = 'new'
        return super().create(validated_data)


class ContactRequestUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating contact requests (staff only).

    Allows staff to update status, assign to someone, and add internal notes.
    """

    class Meta:
        model = ContactRequest
        fields = [
            'status',
            'assigned_to',
            'internal_notes',
        ]

    def validate_assigned_to(self, value):
        """Ensure assigned_to user has staff role."""
        if value and value.role not in ['boss', 'employe']:
            raise serializers.ValidationError(
                "Las solicitudes solo pueden asignarse a usuarios con rol de 'boss' o 'employe'."
            )
        return value
