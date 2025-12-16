"""
Admin configuration for Documents app.
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import Document, DocumentAccessToken, DocumentAccessLog


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """Admin interface for Document model."""

    list_display = [
        'title',
        'case',
        'document_type',
        'file_size_display',
        'is_sensitive',
        'notification_sent',
        'uploaded_at'
    ]
    list_filter = ['document_type', 'is_sensitive', 'notification_sent', 'uploaded_by_client', 'uploaded_at']
    search_fields = ['title', 'description', 'case__case_number', 'case__title']
    readonly_fields = ['uploaded_at', 'updated_at', 'original_filename', 'file_size', 'mime_type', 'file_size_mb', 'file_extension']

    fieldsets = (
        ('Información Básica', {
            'fields': ('case', 'title', 'description', 'document_type')
        }),
        ('Archivo', {
            'fields': ('file', 'original_filename', 'file_size_mb', 'file_extension', 'mime_type')
        }),
        ('Seguridad', {
            'fields': ('is_sensitive', 'uploaded_by_client', 'notification_sent', 'notification_sent_at')
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'uploaded_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def file_size_display(self, obj):
        """Display file size in MB."""
        return f"{obj.file_size_mb} MB"
    file_size_display.short_description = 'Tamaño'


@admin.register(DocumentAccessToken)
class DocumentAccessTokenAdmin(admin.ModelAdmin):
    """Admin interface for DocumentAccessToken model."""

    list_display = [
        'document',
        'token_type',
        'client',
        'code_display',
        'created_at',
        'expires_at',
        'used',
        'attempts'
    ]
    list_filter = ['token_type', 'used', 'created_at']
    search_fields = ['document__title', 'client__full_name', 'access_code']
    readonly_fields = ['access_code', 'download_token', 'created_at', 'expires_at', 'used_at', 'ip_address', 'user_agent']

    fieldsets = (
        ('Token Info', {
            'fields': ('document', 'token_type', 'requested_by', 'client')
        }),
        ('Códigos', {
            'fields': ('access_code', 'download_token')
        }),
        ('Estado', {
            'fields': ('created_at', 'expires_at', 'used', 'used_at', 'attempts')
        }),
        ('Seguridad', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
    )

    def code_display(self, obj):
        """Display access code with color coding."""
        if obj.token_type == 'access' and obj.access_code:
            color = 'red' if obj.used else 'green'
            return format_html('<span style="font-weight:bold;color:{}">{}</span>', color, obj.access_code)
        return '-'
    code_display.short_description = 'Código'


@admin.register(DocumentAccessLog)
class DocumentAccessLogAdmin(admin.ModelAdmin):
    """Admin interface for DocumentAccessLog model."""

    list_display = [
        'document',
        'user',
        'event_type',
        'success',
        'timestamp',
        'ip_address'
    ]
    list_filter = ['event_type', 'success', 'timestamp']
    search_fields = ['document__title', 'user__name', 'details']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'

    fieldsets = (
        ('Evento', {
            'fields': ('document', 'user', 'event_type', 'success', 'details')
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent', 'timestamp')
        }),
    )
