from django.db import models
from django.conf import settings


class Appointment(models.Model):
    """
    Appointment model with Google Calendar integration.
    """
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    )

    client = models.ForeignKey('clients.Client', on_delete=models.CASCADE, related_name='appointments')
    lawyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='appointments')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    google_event_id = models.CharField(max_length=255, blank=True, null=True, help_text='Google Calendar Event ID')
    meet_link = models.URLField(blank=True, null=True, help_text='Google Meet link')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointments'
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'
        ordering = ['start_time']

    def __str__(self):
        return f"{self.title} - {self.client.full_name} at {self.start_time}"


class AppointmentNotification(models.Model):
    """
    Notification log for appointments.
    """
    TYPE_CHOICES = (
        ('confirmation', 'Confirmation'),
        ('reminder_24h', 'Reminder 24h'),
        ('reminder_1h', 'Reminder 1h'),
        ('cancellation', 'Cancellation'),
    )

    CHANNEL_CHOICES = (
        ('email', 'Email'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    )

    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'appointment_notifications'
        verbose_name = 'Appointment Notification'
        verbose_name_plural = 'Appointment Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} - {self.appointment.title} ({self.status})"
