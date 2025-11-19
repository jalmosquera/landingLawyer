from django.contrib import admin
from .models import Client, ClientNote, CommunicationLog


class ClientNoteInline(admin.TabularInline):
    model = ClientNote
    extra = 0
    readonly_fields = ('created_at', 'created_by')


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'phone', 'lawyer', 'is_active', 'created_at')
    list_filter = ('is_active', 'lawyer', 'created_at')
    search_fields = ('full_name', 'email', 'phone', 'dni_curp')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ClientNoteInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('full_name', 'email', 'phone', 'lawyer')
        }),
        ('Legal Documents', {
            'fields': ('dni_curp', 'address', 'city', 'state', 'postal_code')
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        }),
    )


@admin.register(ClientNote)
class ClientNoteAdmin(admin.ModelAdmin):
    list_display = ('client', 'created_by', 'created_at')
    list_filter = ('created_at', 'created_by')
    search_fields = ('client__full_name', 'content')
    readonly_fields = ('created_at',)


@admin.register(CommunicationLog)
class CommunicationLogAdmin(admin.ModelAdmin):
    list_display = ('client', 'type', 'subject', 'status', 'sent_at')
    list_filter = ('type', 'status', 'sent_at')
    search_fields = ('client__full_name', 'subject', 'body')
    readonly_fields = ('created_at', 'sent_at', 'delivered_at', 'opened_at')
