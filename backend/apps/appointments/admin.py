from django.contrib import admin
from .models import Appointment, AppointmentNotification


class AppointmentNotificationInline(admin.TabularInline):
    model = AppointmentNotification
    extra = 0
    readonly_fields = ('sent_at', 'created_at')


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'client', 'lawyer', 'start_time', 'end_time', 'status', 'google_event_id')
    list_filter = ('status', 'start_time', 'lawyer')
    search_fields = ('title', 'client__full_name', 'description')
    readonly_fields = ('google_event_id', 'meet_link', 'created_at', 'updated_at')
    inlines = [AppointmentNotificationInline]

    fieldsets = (
        ('Appointment Details', {
            'fields': ('title', 'description', 'client', 'lawyer')
        }),
        ('Schedule', {
            'fields': ('start_time', 'end_time', 'status')
        }),
        ('Google Calendar', {
            'fields': ('google_event_id', 'meet_link')
        }),
        ('Cancellation', {
            'fields': ('cancelled_at', 'cancellation_reason')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(AppointmentNotification)
class AppointmentNotificationAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'type', 'channel', 'status', 'sent_at')
    list_filter = ('type', 'channel', 'status', 'sent_at')
    search_fields = ('appointment__title',)
    readonly_fields = ('sent_at', 'created_at')
