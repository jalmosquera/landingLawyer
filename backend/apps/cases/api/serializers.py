"""
Case API serializers.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.cases.models import Case
from apps.clients.api.serializers import ClientMinimalSerializer

User = get_user_model()


class CaseSerializer(serializers.ModelSerializer):
    """
    Serializer for Case model with full details.

    Used for listing and retrieving case information.
    Includes nested client data and computed properties.
    """

    client_data = ClientMinimalSerializer(source='client', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True, allow_null=True)
    updated_by_name = serializers.CharField(source='updated_by.name', read_only=True, allow_null=True)
    days_open = serializers.SerializerMethodField()
    document_count = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = [
            'id',
            'client',
            'client_data',
            'assigned_to',
            'assigned_to_name',
            'case_number',
            'title',
            'description',
            'case_type',
            'status',
            'priority',
            'opened_at',
            'closed_at',
            'internal_notes',
            'days_open',
            'document_count',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'id',
            'case_number',
            'opened_at',
            'closed_at',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by'
        ]

    def get_days_open(self, obj):
        """Calculate days since case was opened."""
        from django.utils import timezone
        if obj.closed_at:
            return (obj.closed_at - obj.opened_at).days
        return (timezone.now().date() - obj.opened_at).days

    def get_document_count(self, obj):
        """Get total number of documents for this case."""
        return obj.documents.count()


class CaseCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new cases.

    Auto-generates case_number and sets created_by from request user.
    """

    class Meta:
        model = Case
        fields = [
            'id',
            'case_number',
            'client',
            'assigned_to',
            'title',
            'description',
            'case_type',
            'status',
            'priority',
            'internal_notes',
        ]
        read_only_fields = ['id', 'case_number']

    def validate_assigned_to(self, value):
        """Ensure assigned_to user has staff role."""
        if value.role not in ['boss', 'employe']:
            raise serializers.ValidationError(
                "El caso solo puede asignarse a usuarios con rol de 'boss' o 'employe'."
            )
        return value

    def create(self, validated_data):
        """Create case and set created_by from request user."""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CaseUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing cases.

    Sets updated_by from request user on each update.
    """

    class Meta:
        model = Case
        fields = [
            'client',
            'assigned_to',
            'title',
            'description',
            'case_type',
            'status',
            'priority',
            'internal_notes',
        ]

    def validate_assigned_to(self, value):
        """Ensure assigned_to user has staff role."""
        if value.role not in ['boss', 'employe']:
            raise serializers.ValidationError(
                "El caso solo puede asignarse a usuarios con rol de 'boss' o 'employe'."
            )
        return value

    def update(self, instance, validated_data):
        """Update case and set updated_by from request user."""
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class CaseMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal case serializer for nested representations.

    Used in client listings, document listings, and other relations
    where full case details aren't needed.
    """

    client_data = ClientMinimalSerializer(source='client', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = Case
        fields = [
            'id',
            'client',
            'client_data',
            'case_number',
            'title',
            'description',
            'case_type',
            'status',
            'status_display',
            'priority',
            'priority_display',
            'assigned_to',
            'assigned_to_name',
            'opened_at',
            'closed_at',
            'internal_notes',
        ]
        read_only_fields = fields


class CaseTimelineSerializer(serializers.Serializer):
    """
    Serializer for case timeline events.

    Aggregates events from different sources (updates, documents, appointments)
    into a unified timeline view.
    """

    event_type = serializers.ChoiceField(choices=[
        ('created', 'Caso Creado'),
        ('updated', 'Caso Actualizado'),
        ('document_uploaded', 'Documento Subido'),
        ('appointment_scheduled', 'Cita Programada'),
        ('status_changed', 'Estado Cambiado'),
        ('closed', 'Caso Cerrado'),
    ])
    timestamp = serializers.DateTimeField()
    description = serializers.CharField()
    user = serializers.CharField(allow_null=True)
    details = serializers.DictField(required=False)
