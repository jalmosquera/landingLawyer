"""
Document API serializers.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from apps.documents.models import Document, DocumentAccessToken, DocumentAccessLog
from apps.cases.api.serializers import CaseMinimalSerializer

User = get_user_model()


class DocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for Document model with full details.

    Used for listing and retrieving document information.
    Includes case data and file metadata.
    """

    case_data = CaseMinimalSerializer(source='case', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True, allow_null=True)
    file_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id',
            'case',
            'case_data',
            'uploaded_by',
            'uploaded_by_name',
            'file',
            'file_url',
            'original_filename',
            'file_size',
            'file_size_display',
            'file_extension',
            'mime_type',
            'title',
            'description',
            'document_type',
            'document_type_display',
            'is_sensitive',
            'uploaded_by_client',
            'notification_sent',
            'notification_sent_at',
            'uploaded_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'uploaded_by',
            'original_filename',
            'file_size',
            'mime_type',
            'file_extension',
            'notification_sent',
            'notification_sent_at',
            'uploaded_at',
            'updated_at'
        ]

    def get_file_url(self, obj):
        """Get file URL (for staff only, clients use download token)."""
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_file_size_display(self, obj):
        """Display file size in MB."""
        return f"{obj.file_size_mb} MB"


class DocumentUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for uploading new documents.

    Handles file upload with multipart/form-data.
    Auto-extracts file metadata (size, mime type, original name).
    """

    class Meta:
        model = Document
        fields = [
            'case',
            'file',
            'title',
            'description',
            'document_type',
            'is_sensitive',
        ]

    def validate_file(self, value):
        """Validate file size and type."""
        # Check file size (max 20MB by default)
        max_size = getattr(settings, 'MAX_DOCUMENT_SIZE', 20 * 1024 * 1024)
        if value.size > max_size:
            raise serializers.ValidationError(
                f"El archivo es demasiado grande. Tamaño máximo: {max_size / (1024 * 1024):.0f}MB"
            )

        # Check file extension (optional - can add whitelist)
        allowed_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt', '.zip']
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Tipo de archivo no permitido. Extensiones permitidas: {', '.join(allowed_extensions)}"
            )

        return value

    def create(self, validated_data):
        """Create document and extract file metadata."""
        file = validated_data['file']

        # Extract metadata
        validated_data['original_filename'] = file.name
        validated_data['file_size'] = file.size
        validated_data['mime_type'] = file.content_type or 'application/octet-stream'

        # Set uploaded_by from request user
        validated_data['uploaded_by'] = self.context['request'].user

        # Check if uploaded by client
        if self.context['request'].user.role == 'client':
            validated_data['uploaded_by_client'] = True

        return super().create(validated_data)


class DocumentMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal document serializer for nested representations.

    Used in case listings and other relations where full document details aren't needed.
    """

    case_data = CaseMinimalSerializer(source='case', read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    file_size_display = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id',
            'case',
            'case_data',
            'title',
            'description',
            'document_type',
            'document_type_display',
            'original_filename',
            'file_size_display',
            'file_extension',
            'file_url',
            'is_sensitive',
            'uploaded_by_client',
            'notification_sent',
            'uploaded_at',
        ]
        read_only_fields = fields

    def get_file_size_display(self, obj):
        """Display file size in MB."""
        return f"{obj.file_size_mb} MB"

    def get_file_url(self, obj):
        """Get file URL."""
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None


class DocumentAccessTokenSerializer(serializers.ModelSerializer):
    """
    Serializer for DocumentAccessToken.

    Used for displaying token information to staff.
    """

    document_title = serializers.CharField(source='document.title', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.name', read_only=True)
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = DocumentAccessToken
        fields = [
            'id',
            'document',
            'document_title',
            'client',
            'client_name',
            'requested_by',
            'requested_by_name',
            'token_type',
            'access_code',
            'created_at',
            'expires_at',
            'used',
            'used_at',
            'attempts',
            'is_valid',
        ]
        read_only_fields = fields

    def get_is_valid(self, obj):
        """Check if token is still valid."""
        return obj.is_valid()


class DocumentAccessLogSerializer(serializers.ModelSerializer):
    """
    Serializer for DocumentAccessLog.

    Used for displaying access audit trail.
    """

    document_title = serializers.CharField(source='document.title', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True, allow_null=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = DocumentAccessLog
        fields = [
            'id',
            'document',
            'document_title',
            'user',
            'user_name',
            'event_type',
            'event_type_display',
            'success',
            'details',
            'ip_address',
            'user_agent',
            'timestamp',
        ]
        read_only_fields = fields


class ValidateCodeSerializer(serializers.Serializer):
    """
    Serializer for validating 6-digit access codes.

    Used by public endpoint for clients to validate their code
    and receive a download token.
    """

    access_code = serializers.CharField(
        min_length=6,
        max_length=6,
        required=True,
        help_text='Código de acceso de 6 dígitos'
    )
    email = serializers.EmailField(
        required=True,
        help_text='Email del cliente (para verificación adicional)'
    )

    def validate_access_code(self, value):
        """Ensure code is numeric."""
        if not value.isdigit():
            raise serializers.ValidationError("El código debe contener solo dígitos.")
        return value


class DownloadTokenResponseSerializer(serializers.Serializer):
    """
    Serializer for download token response.

    Returned after successful code validation.
    """

    download_token = serializers.CharField()
    document_id = serializers.IntegerField()
    document_title = serializers.CharField()
    original_filename = serializers.CharField()
    expires_at = serializers.DateTimeField()
    download_url = serializers.CharField()


class NotifyClientSerializer(serializers.Serializer):
    """
    Serializer for notify-client action.

    Optional custom message can be included in the notification.
    """

    custom_message = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
        help_text='Mensaje personalizado opcional para incluir en la notificación'
    )
