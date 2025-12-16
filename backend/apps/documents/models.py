"""
Document models for secure file management and access control.

This module defines models for handling legal documents with a two-phase
security system: 6-digit access codes and temporary download tokens.
"""

import os
import secrets
from datetime import timedelta

from django.db import models
from django.conf import settings
from django.utils import timezone


def document_upload_path(instance, filename):
    """
    Generate upload path: documents/cases/{case_id}/{filename}
    Keeps original filename for user recognition.
    """
    return f'documents/cases/{instance.case.id}/{filename}'


class Document(models.Model):
    """
    Document model for case-related files.

    Supports local filesystem storage (MEDIA_ROOT) with optional
    access control via DocumentAccessToken.

    Attributes:
        case: Case this document belongs to
        uploaded_by: User who uploaded the document
        file: Actual file (stored in MEDIA_ROOT)
        original_filename: Original name of the uploaded file
        file_size: Size in bytes
        mime_type: MIME type (e.g., 'application/pdf')
        title: Display title for the document
        description: Optional description
        document_type: Type of legal document
        is_sensitive: If True, requires access code for client download
        uploaded_by_client: True if uploaded by client (vs staff)
        notification_sent: True if client has been notified about this document
        notification_sent_at: Timestamp of notification
        uploaded_at: When file was uploaded
        updated_at: Last modification timestamp

    Example:
        >>> document = Document.objects.create(
        ...     case=case,
        ...     file=uploaded_file,
        ...     title='Contrato de Arrendamiento',
        ...     document_type='contract',
        ...     uploaded_by=staff_user
        ... )
    """

    DOCUMENT_TYPE_CHOICES = [
        ('contract', 'Contrato'),
        ('evidence', 'Prueba'),
        ('resolution', 'Resolución'),
        ('report', 'Informe'),
        ('correspondence', 'Correspondencia'),
        ('identification', 'Identificación'),
        ('other', 'Otro'),
    ]

    # Relationships
    case = models.ForeignKey(
        'cases.Case',
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Caso'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents',
        verbose_name='Subido por'
    )

    # File fields
    file = models.FileField(
        'Archivo',
        upload_to=document_upload_path,
        max_length=500
    )
    original_filename = models.CharField(
        'Nombre original',
        max_length=255,
        editable=False
    )
    file_size = models.PositiveIntegerField(
        'Tamaño',
        help_text='Tamaño del archivo en bytes',
        editable=False
    )
    mime_type = models.CharField(
        'Tipo MIME',
        max_length=100,
        blank=True,
        editable=False
    )

    # Metadata
    title = models.CharField('Título', max_length=200)
    description = models.TextField('Descripción', blank=True)
    document_type = models.CharField(
        'Tipo de documento',
        max_length=20,
        choices=DOCUMENT_TYPE_CHOICES,
        default='other'
    )

    # Security and tracking
    is_sensitive = models.BooleanField(
        'Sensible',
        default=True,
        help_text='Si es verdadero, requiere código de acceso para descarga por cliente'
    )
    uploaded_by_client = models.BooleanField(
        'Subido por cliente',
        default=False,
        help_text='Verdadero si fue subido por el cliente (no staff)'
    )
    notification_sent = models.BooleanField(
        'Notificación enviada',
        default=False
    )
    notification_sent_at = models.DateTimeField(
        'Fecha de notificación',
        null=True,
        blank=True
    )

    # Timestamps
    uploaded_at = models.DateTimeField('Fecha de subida', auto_now_add=True)
    updated_at = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        db_table = 'documents'
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['case', 'document_type']),
            models.Index(fields=['uploaded_at']),
            models.Index(fields=['is_sensitive']),
            models.Index(fields=['uploaded_by_client']),
        ]

    def __str__(self):
        """Return document title and case number."""
        return f"{self.title} - {self.case.case_number}"

    @property
    def file_extension(self):
        """Extract file extension from original filename."""
        return os.path.splitext(self.original_filename)[1].lower()

    @property
    def file_size_mb(self):
        """Return file size in megabytes."""
        return round(self.file_size / (1024 * 1024), 2)


class DocumentAccessToken(models.Model):
    """
    Two-phase token system for secure document access.

    Phase 1: Access code (6-digit) sent via email
    Phase 2: Download token (URL-safe) generated after code validation

    Attributes:
        document: Document to grant access to
        requested_by: Staff member who initiated notification
        client: Client who will receive access code
        token_type: Either 'access' (6-digit) or 'download' (URL-safe)
        access_code: 6-digit code sent via email
        download_token: URL-safe token for file download
        created_at: When token was created
        expires_at: When token expires
        used: Whether token has been used
        used_at: When token was used
        ip_address: IP address that used the token (audit)
        user_agent: User agent that used the token (audit)
        attempts: Number of validation attempts

    Example:
        >>> # Create access code (sent via email)
        >>> access_token = DocumentAccessToken.objects.create(
        ...     document=document,
        ...     requested_by=staff,
        ...     client=client,
        ...     token_type='access'
        ... )
        >>> # Later, after client validates code:
        >>> download_token = DocumentAccessToken.objects.create(
        ...     document=document,
        ...     requested_by=staff,
        ...     client=client,
        ...     token_type='download'
        ... )
    """

    TOKEN_TYPE_CHOICES = [
        ('access', 'Código de Acceso'),  # 6-digit code sent via email
        ('download', 'Token de Descarga'),  # Generated after code validation
    ]

    # Relationships
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='access_tokens',
        verbose_name='Documento'
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='document_access_tokens_created',
        help_text='Staff member quien envió la notificación',
        verbose_name='Solicitado por'
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_document_tokens',
        limit_choices_to={'role': 'client'},
        help_text='Cliente que recibe el código de acceso',
        verbose_name='Cliente'
    )

    # Token fields
    token_type = models.CharField(
        'Tipo de token',
        max_length=10,
        choices=TOKEN_TYPE_CHOICES
    )
    access_code = models.CharField(
        'Código de acceso',
        max_length=6,
        db_index=True,
        null=True,
        blank=True,
        help_text='Código de 6 dígitos enviado por email (solo para tipo access)'
    )
    download_token = models.CharField(
        'Token de descarga',
        max_length=64,
        db_index=True,
        null=True,
        blank=True,
        help_text='Token URL-safe para descarga (solo para tipo download)'
    )

    # Lifecycle fields
    created_at = models.DateTimeField('Creado', auto_now_add=True)
    expires_at = models.DateTimeField('Expira')
    used = models.BooleanField('Usado', default=False)
    used_at = models.DateTimeField('Usado en', null=True, blank=True)

    # Security tracking
    ip_address = models.GenericIPAddressField(
        'Dirección IP',
        null=True,
        blank=True
    )
    user_agent = models.TextField('User Agent', blank=True)
    attempts = models.PositiveIntegerField(
        'Intentos',
        default=0,
        help_text='Contador de intentos de validación'
    )

    class Meta:
        db_table = 'document_access_tokens'
        verbose_name = 'Token de Acceso a Documento'
        verbose_name_plural = 'Tokens de Acceso a Documentos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['access_code', 'used']),
            models.Index(fields=['download_token', 'used']),
            models.Index(fields=['document', 'client', 'token_type']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        """Return token type and document title."""
        return f"{self.get_token_type_display()} - {self.document.title}"

    def save(self, *args, **kwargs):
        """
        Auto-generate tokens and expiry times based on type.

        - Access codes: 6-digit (100000-999999), valid for 24 hours
        - Download tokens: URL-safe, valid for 1 hour
        """
        if not self.pk:
            if self.token_type == 'access':
                # Generate 6-digit code (100000-999999)
                self.access_code = f"{secrets.randbelow(900000) + 100000}"
                # Valid for 24 hours
                self.expires_at = timezone.now() + timedelta(hours=24)

            elif self.token_type == 'download':
                # Generate URL-safe token
                self.download_token = secrets.token_urlsafe(48)
                # Valid for 1 hour (configurable)
                expiry_hours = getattr(settings, 'DOCUMENT_TOKEN_EXPIRY_HOURS', 1)
                self.expires_at = timezone.now() + timedelta(hours=expiry_hours)

        super().save(*args, **kwargs)

    def is_valid(self):
        """
        Check if token is still valid.
        Valid if: not used AND not expired.
        """
        return not self.used and timezone.now() < self.expires_at

    def mark_as_used(self, ip_address=None, user_agent=None):
        """Mark token as used with tracking information."""
        self.used = True
        self.used_at = timezone.now()
        if ip_address:
            self.ip_address = ip_address
        if user_agent:
            self.user_agent = user_agent
        self.save(update_fields=['used', 'used_at', 'ip_address', 'user_agent'])


class DocumentAccessLog(models.Model):
    """
    Audit trail for document access events.

    Tracks all document-related events for security and compliance.

    Attributes:
        document: Document being accessed
        user: User performing the action
        event_type: Type of event (upload, download, notification, etc.)
        success: Whether the event was successful
        details: Additional details or error messages
        ip_address: IP address of the request
        user_agent: User agent of the request
        timestamp: When the event occurred

    Example:
        >>> DocumentAccessLog.objects.create(
        ...     document=document,
        ...     user=client,
        ...     event_type='download',
        ...     success=True,
        ...     ip_address='192.168.1.1'
        ... )
    """

    EVENT_TYPE_CHOICES = [
        ('upload', 'Documento Subido'),
        ('view', 'Documento Visualizado'),
        ('download', 'Documento Descargado'),
        ('notification_sent', 'Notificación Enviada'),
        ('code_validated', 'Código Validado'),
        ('access_denied', 'Acceso Denegado'),
        ('token_expired', 'Token Expirado'),
    ]

    # Relationships
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='access_logs',
        verbose_name='Documento'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='document_access_logs',
        verbose_name='Usuario'
    )

    # Event details
    event_type = models.CharField(
        'Tipo de evento',
        max_length=20,
        choices=EVENT_TYPE_CHOICES
    )
    success = models.BooleanField(
        'Exitoso',
        default=True,
        help_text='Si el evento fue exitoso'
    )
    details = models.TextField(
        'Detalles',
        blank=True,
        help_text='Contexto adicional o mensajes de error'
    )

    # Request metadata
    ip_address = models.GenericIPAddressField(
        'Dirección IP',
        null=True,
        blank=True
    )
    user_agent = models.TextField('User Agent', blank=True)

    # Timestamp
    timestamp = models.DateTimeField(
        'Fecha y hora',
        auto_now_add=True,
        db_index=True
    )

    class Meta:
        db_table = 'document_access_logs'
        verbose_name = 'Registro de Acceso a Documento'
        verbose_name_plural = 'Registros de Acceso a Documentos'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['document', 'event_type', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        """Return event type, document, and timestamp."""
        return f"{self.get_event_type_display()} - {self.document.title} - {self.timestamp}"
