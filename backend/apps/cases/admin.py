"""
Admin configuration for Cases app.
"""

from django.contrib import admin
from .models import Case


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    """Admin interface for Case model."""

    list_display = [
        'case_number',
        'title',
        'client',
        'assigned_to',
        'case_type',
        'status',
        'priority',
        'opened_at',
        'document_count'
    ]
    list_filter = ['status', 'case_type', 'priority', 'opened_at', 'created_at']
    search_fields = ['case_number', 'title', 'description', 'client__full_name']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by', 'days_open']

    fieldsets = (
        ('Información del Caso', {
            'fields': ('case_number', 'title', 'description', 'case_type', 'status', 'priority')
        }),
        ('Asignación', {
            'fields': ('client', 'assigned_to')
        }),
        ('Fechas', {
            'fields': ('opened_at', 'closed_at', 'days_open')
        }),
        ('Notas Internas', {
            'fields': ('internal_notes',)
        }),
        ('Información de Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def document_count(self, obj):
        """Display count of documents."""
        return obj.document_count
    document_count.short_description = 'Documentos'
