from rest_framework import serializers
from apps.clients.models import Client, ClientNote, CommunicationLog


class ClientNoteSerializer(serializers.ModelSerializer):
    """
    Serializer for client notes.
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ClientNote
        fields = ['id', 'content', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']


class CommunicationLogSerializer(serializers.ModelSerializer):
    """
    Serializer for communication logs.
    """

    class Meta:
        model = CommunicationLog
        fields = ['id', 'type', 'subject', 'body', 'status', 'sent_at', 'delivered_at', 'opened_at', 'created_at']
        read_only_fields = ['id', 'created_at', 'sent_at', 'delivered_at', 'opened_at']


class ClientListSerializer(serializers.ModelSerializer):
    """
    Serializer for client list (minimal fields).
    """
    lawyer_name = serializers.CharField(source='lawyer.get_full_name', read_only=True)

    class Meta:
        model = Client
        fields = ['id', 'full_name', 'email', 'phone', 'lawyer_name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class ClientDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for client details (includes related data).
    """
    lawyer_name = serializers.CharField(source='lawyer.get_full_name', read_only=True)
    notes = ClientNoteSerializer(many=True, read_only=True)
    communications = CommunicationLogSerializer(many=True, read_only=True)
    reports_count = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'full_name', 'email', 'phone', 'dni_curp',
            'address', 'city', 'state', 'postal_code',
            'lawyer', 'lawyer_name', 'is_active',
            'notes', 'communications', 'reports_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_reports_count(self, obj):
        return obj.reports.count() if hasattr(obj, 'reports') else 0


class ClientCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for client creation.
    """

    class Meta:
        model = Client
        fields = [
            'full_name', 'email', 'phone', 'dni_curp',
            'address', 'city', 'state', 'postal_code', 'is_active'
        ]

    def create(self, validated_data):
        # Set the lawyer from the request context
        validated_data['lawyer'] = self.context['request'].user
        return super().create(validated_data)
