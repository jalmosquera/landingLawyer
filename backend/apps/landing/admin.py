"""
Admin configuration for Landing app.
"""

from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from .models import Service, Testimonial, SuccessCase, ContactRequest, SiteSettings


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


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    """
    Admin interface for SiteSettings.

    Allows the site owner to set a payment deadline date and/or manually
    disable the public-facing site. When disabled, visitors see a styled
    maintenance page instead of the normal content.
    """

    list_display = ['site_status_badge', 'payment_deadline', 'days_remaining', 'is_manually_disabled', 'updated_at']
    readonly_fields = ['updated_at', 'site_status_badge', 'days_remaining']

    fieldsets = (
        ('🚦 Estado Actual del Sitio', {
            'fields': ('site_status_badge', 'days_remaining'),
            'description': 'Vista rápida del estado público del sitio.',
        }),
        ('💳 Control de Pago', {
            'fields': ('payment_deadline', 'is_manually_disabled'),
            'description': (
                'Establece la fecha límite de pago. Si hoy supera esa fecha, '
                'el sitio se inhabilitará automáticamente y los visitantes verán '
                'la página de mantenimiento. También puedes deshabilitarlo manualmente.'
            ),
        }),
        ('📄 Página de Mantenimiento', {
            'fields': ('maintenance_title', 'maintenance_message', 'contact_email'),
            'description': 'Personaliza lo que verán los visitantes cuando el sitio esté inhabilitado.',
        }),
        ('⏱ Metadata', {
            'fields': ('updated_at',),
            'classes': ('collapse',),
        }),
    )

    def site_status_badge(self, obj):
        """Show a colored badge indicating whether the site is active."""
        if obj.is_site_active:
            return format_html(
                '<span style="background:#16a34a;color:#fff;padding:4px 12px;'
                'border-radius:999px;font-weight:600;font-size:13px;">✅ Sitio Activo</span>'
            )
        return format_html(
            '<span style="background:#dc2626;color:#fff;padding:4px 12px;'
            'border-radius:999px;font-weight:600;font-size:13px;">🔴 Sitio Inhabilitado</span>'
        )
    site_status_badge.short_description = 'Estado del sitio'

    def days_remaining(self, obj):
        """Show how many days remain until the payment deadline."""
        if not obj.payment_deadline:
            return format_html('<span style="color:#6b7280;">Sin fecha límite configurada</span>')
        today = timezone.now().date()
        delta = (obj.payment_deadline - today).days
        if delta > 7:
            color = '#16a34a'
            icon = '🟢'
        elif delta > 0:
            color = '#d97706'
            icon = '🟡'
        elif delta == 0:
            color = '#dc2626'
            icon = '🔴'
        else:
            color = '#dc2626'
            icon = '🔴'
        if delta >= 0:
            msg = f'{icon} {delta} día(s) restantes'
        else:
            msg = f'{icon} Venció hace {abs(delta)} día(s)'
        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>', color, msg
        )
    days_remaining.short_description = 'Días restantes'

    def has_module_perms(self, request, app_label=None):
        """Visible only to superusers."""
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        """Accessible only to superusers."""
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        """Editable only to superusers."""
        return request.user.is_superuser

    def has_add_permission(self, request):
        """Only allow one instance, and only superusers."""
        return request.user.is_superuser and not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of the settings singleton."""
        return False

    def get_object(self, request, object_id, from_field=None):
        """Auto-create singleton if it doesn't exist."""
        SiteSettings.get_settings()
        return super().get_object(request, object_id, from_field)

    def changelist_view(self, request, extra_context=None):
        """Redirect to the single settings object instead of showing a list."""
        settings_obj = SiteSettings.get_settings()
        from django.shortcuts import redirect
        return redirect(f'/admin/landing/sitesettings/{settings_obj.pk}/change/')
