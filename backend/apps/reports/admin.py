from django.contrib import admin
from .models import LegalReport


@admin.register(LegalReport)
class LegalReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'client', 'status', 'created_by', 'file_size', 'created_at')
    list_filter = ('status', 'created_at', 'created_by')
    search_fields = ('title', 'client__full_name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'file_hash', 'file_size')

    fieldsets = (
        ('Report Information', {
            'fields': ('title', 'description', 'client', 'status')
        }),
        ('File Details', {
            'fields': ('pdf_file', 'file_size', 'file_hash')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )
