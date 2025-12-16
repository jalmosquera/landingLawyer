"""
Admin configuration for Appointments app.
"""

from django.contrib import admin
from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Admin interface for Appointment model."""

    list_display = [
        'title',
        'display_name',
        'starts_at',
        'duration_minutes',
        'appointment_type',
        'status',
        'is_public_request',
        'is_synced_with_google'
    ]
    list_filter = ['status', 'appointment_type', 'starts_at', 'created_at']
    search_fields = [
        'title',
        'description',
        'client__full_name',
        'requested_by_name',
        'requested_by_email',
        'case__case_number'
    ]
    readonly_fields = ['created_at', 'updated_at', 'last_sync_at', 'duration_minutes']

    fieldsets = (
        ('Información de la Cita', {
            'fields': ('title', 'description', 'appointment_type', 'status')
        }),
        ('Cliente/Solicitante', {
            'fields': ('client', 'case', 'requested_by_name', 'requested_by_email', 'requested_by_phone')
        }),
        ('Fecha y Hora', {
            'fields': ('starts_at', 'ends_at', 'duration_minutes')
        }),
        ('Ubicación', {
            'fields': ('location',)
        }),
        ('Google Calendar', {
            'fields': ('google_calendar_id', 'google_meet_link', 'last_sync_at'),
            'classes': ('collapse',)
        }),
        ('Notas Internas', {
            'fields': ('internal_notes',)
        }),
        ('Información de Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def is_public_request(self, obj):
        """Display if it's a public request."""
        return obj.is_public_request
    is_public_request.boolean = True
    is_public_request.short_description = 'Pública'

    def is_synced_with_google(self, obj):
        """Display if synced with Google Calendar."""
        return obj.is_synced_with_google
    is_synced_with_google.boolean = True
    is_synced_with_google.short_description = 'Sync Google'
