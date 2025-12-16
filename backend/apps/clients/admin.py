"""
Admin configuration for Clients app.
"""

from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Admin interface for Client model."""

    list_display = [
        'full_name',
        'email',
        'phone',
        'has_portal_access',
        'active_cases_count',
        'created_at'
    ]
    list_filter = ['identification_type', 'created_at']
    search_fields = ['full_name', 'email', 'phone', 'identification_number']
    readonly_fields = ['created_at', 'updated_at', 'created_by']

    fieldsets = (
        ('Información Personal', {
            'fields': ('full_name', 'email', 'phone')
        }),
        ('Identificación', {
            'fields': ('identification_type', 'identification_number')
        }),
        ('Dirección', {
            'fields': ('address', 'city', 'state', 'postal_code')
        }),
        ('Portal de Cliente', {
            'fields': ('user',)
        }),
        ('Notas Internas', {
            'fields': ('notes',)
        }),
        ('Información de Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def has_portal_access(self, obj):
        """Display if client has portal access."""
        return obj.has_portal_access
    has_portal_access.boolean = True
    has_portal_access.short_description = 'Portal'

    def active_cases_count(self, obj):
        """Display count of active cases."""
        return obj.active_cases_count
    active_cases_count.short_description = 'Casos Activos'
