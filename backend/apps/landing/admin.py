"""
Admin configuration for Landing app.
"""

from django.contrib import admin
from .models import Service, Testimonial, SuccessCase, ContactRequest


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Admin interface for Service model."""

    list_display = ['title', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['title', 'description']
    list_editable = ['order', 'is_active']

    fieldsets = (
        ('Información del Servicio', {
            'fields': ('title', 'description', 'icon')
        }),
        ('Configuración', {
            'fields': ('order', 'is_active')
        }),
    )


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    """Admin interface for Testimonial model."""

    list_display = ['client_name', 'rating', 'date', 'order', 'is_active']
    list_filter = ['rating', 'is_active', 'date']
    search_fields = ['client_name', 'text']
    list_editable = ['order', 'is_active']

    fieldsets = (
        ('Información del Testimonio', {
            'fields': ('client_name', 'text', 'rating', 'date')
        }),
        ('Configuración', {
            'fields': ('order', 'is_active')
        }),
    )


@admin.register(SuccessCase)
class SuccessCaseAdmin(admin.ModelAdmin):
    """Admin interface for SuccessCase model."""

    list_display = ['title', 'case_type', 'date', 'order', 'is_active']
    list_filter = ['case_type', 'is_active', 'date']
    search_fields = ['title', 'description', 'result']
    list_editable = ['order', 'is_active']

    fieldsets = (
        ('Información del Caso', {
            'fields': ('title', 'description', 'case_type', 'result', 'date')
        }),
        ('Configuración', {
            'fields': ('order', 'is_active')
        }),
    )


@admin.register(ContactRequest)
class ContactRequestAdmin(admin.ModelAdmin):
    """Admin interface for ContactRequest model."""

    list_display = [
        'name',
        'email',
        'subject',
        'request_type',
        'status',
        'assigned_to',
        'created_at'
    ]
    list_filter = ['status', 'request_type', 'created_at']
    search_fields = ['name', 'email', 'subject', 'message']
    readonly_fields = ['created_at']

    fieldsets = (
        ('Información de Contacto', {
            'fields': ('name', 'email', 'phone')
        }),
        ('Solicitud', {
            'fields': ('subject', 'message', 'request_type')
        }),
        ('Gestión', {
            'fields': ('status', 'assigned_to', 'internal_notes')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def is_new(self, obj):
        """Display if request is new."""
        return obj.is_new
    is_new.boolean = True
    is_new.short_description = 'Nueva'
