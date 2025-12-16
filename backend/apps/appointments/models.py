"""
Appointment model for managing client meetings and calendar integration.

This module defines the Appointment model with support for Google Calendar
synchronization and public appointment requests.
"""

from django.db import models
from django.conf import settings
from django.utils import timezone


class Appointment(models.Model):
    """
    Appointment model for scheduling client meetings.

    Supports both internal appointments (staff-created) and public requests
    (from landing page). Integrates with Google Calendar for synchronization.

    Attributes:
        client: Client this appointment is for (optional for public requests)
        case: Related case (optional)
        requested_by_email: Email for public appointment requests
        requested_by_name: Name for public appointment requests
        requested_by_phone: Phone for public appointment requests
        starts_at: Appointment start date and time
        ends_at: Appointment end date and time
        title: Appointment title/subject
        description: Detailed description
        appointment_type: Type of meeting (in-person, phone, video)
        status: Current status (pending, confirmed, cancelled, completed)
        internal_notes: Private notes for staff
        location: Physical location for in-person appointments
        google_calendar_id: Google Calendar event ID for sync
        google_meet_link: Google Meet link for video appointments
        created_at: When appointment was created
        updated_at: Last modification timestamp
        created_by: Staff member who created it (nullable for public requests)

    Example:
        >>> # Staff creates appointment
        >>> appointment = Appointment.objects.create(
        ...     client=client,
        ...     case=case,
        ...     title='Consulta Inicial',
        ...     starts_at=datetime(2024, 12, 20, 10, 0),
        ...     ends_at=datetime(2024, 12, 20, 11, 0),
        ...     appointment_type='in_person',
        ...     created_by=staff_user
        ... )
        >>> # Public appointment request
        >>> appointment = Appointment.objects.create(
        ...     requested_by_name='María García',
        ...     requested_by_email='maria@example.com',
        ...     title='Consulta sobre divorcio',
        ...     starts_at=datetime(2024, 12, 20, 15, 0),
        ...     ends_at=datetime(2024, 12, 20, 16, 0),
        ...     appointment_type='phone',
        ...     status='pending'
        ... )
    """

    APPOINTMENT_TYPE_CHOICES = [
        ('in_person', 'Presencial'),
        ('phone', 'Teléfono'),
        ('video', 'Videollamada'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pendiente'),  # Waiting for lawyer confirmation
        ('confirmed', 'Confirmada'),  # Lawyer confirmed
        ('cancelled', 'Cancelada'),  # Cancelled by either party
        ('completed', 'Completada'),  # Appointment finished
    ]

    # Relationships (optional for public requests)
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
        verbose_name='Cliente',
        help_text='Cliente asociado (opcional para solicitudes públicas)'
    )
    case = models.ForeignKey(
        'cases.Case',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
        verbose_name='Caso',
        help_text='Caso relacionado (opcional)'
    )

    # Public request fields (for landing page appointments)
    requested_by_email = models.EmailField(
        'Email de solicitante',
        blank=True,
        help_text='Email para solicitudes públicas (sin cliente asociado)'
    )
    requested_by_name = models.CharField(
        'Nombre de solicitante',
        max_length=200,
        blank=True,
        help_text='Nombre para solicitudes públicas'
    )
    requested_by_phone = models.CharField(
        'Teléfono de solicitante',
        max_length=20,
        blank=True,
        help_text='Teléfono para solicitudes públicas'
    )

    # Appointment details
    starts_at = models.DateTimeField(
        'Inicia',
        db_index=True
    )
    ends_at = models.DateTimeField(
        'Finaliza',
        db_index=True
    )
    title = models.CharField('Título', max_length=200)
    description = models.TextField('Descripción', blank=True)

    appointment_type = models.CharField(
        'Tipo de cita',
        max_length=20,
        choices=APPOINTMENT_TYPE_CHOICES,
        default='in_person'
    )
    status = models.CharField(
        'Estado',
        max_length=20,
        choices=STATUS_CHOICES,
        default='confirmed'
    )

    # Internal information
    internal_notes = models.TextField(
        'Notas internas',
        blank=True,
        help_text='Notas visibles solo para el staff'
    )
    location = models.CharField(
        'Ubicación',
        max_length=250,
        blank=True,
        help_text='Dirección física para citas presenciales'
    )

    # Google Calendar integration
    google_calendar_id = models.CharField(
        'ID de Google Calendar',
        max_length=255,
        blank=True,
        db_index=True,
        help_text='ID del evento en Google Calendar'
    )
    google_meet_link = models.URLField(
        'Enlace de Google Meet',
        max_length=500,
        blank=True,
        help_text='URL de Google Meet para videollamadas'
    )
    last_sync_at = models.DateTimeField(
        'Última sincronización',
        null=True,
        blank=True,
        help_text='Última vez que se sincronizó con Google Calendar'
    )

    # Audit fields
    created_at = models.DateTimeField('Fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última actualización', auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_appointments',
        limit_choices_to={'role__in': ['boss', 'employe']},
        verbose_name='Creado por',
        help_text='Staff que creó la cita (null para solicitudes públicas)'
    )

    class Meta:
        db_table = 'appointments'
        verbose_name = 'Cita'
        verbose_name_plural = 'Citas'
        ordering = ['starts_at']
        indexes = [
            models.Index(fields=['starts_at', 'status']),
            models.Index(fields=['client', 'starts_at']),
            models.Index(fields=['case', 'starts_at']),
            models.Index(fields=['status', 'starts_at']),
            models.Index(fields=['google_calendar_id']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        """Return appointment title and date."""
        date_str = self.starts_at.strftime('%d/%m/%Y %H:%M')
        return f"{self.title} - {date_str}"

    def clean(self):
        """Validate appointment data."""
        from django.core.exceptions import ValidationError

        # Validate start/end times
        if self.starts_at and self.ends_at:
            if self.ends_at <= self.starts_at:
                raise ValidationError({
                    'ends_at': 'La hora de finalización debe ser posterior a la hora de inicio'
                })

        # Validate that either client OR public request fields are filled
        has_client = self.client is not None
        has_public_info = bool(self.requested_by_email or self.requested_by_name)

        if not has_client and not has_public_info:
            raise ValidationError(
                'La cita debe tener un cliente asociado o datos del solicitante público'
            )

    @property
    def duration_minutes(self):
        """Calculate appointment duration in minutes."""
        if self.starts_at and self.ends_at:
            delta = self.ends_at - self.starts_at
            return int(delta.total_seconds() / 60)
        return 0

    @property
    def is_upcoming(self):
        """Check if appointment is in the future."""
        return self.starts_at > timezone.now()

    @property
    def is_today(self):
        """Check if appointment is today."""
        today = timezone.now().date()
        return self.starts_at.date() == today

    @property
    def is_public_request(self):
        """Check if this is a public appointment request (no client)."""
        return self.client is None and bool(self.requested_by_email or self.requested_by_name)

    @property
    def display_name(self):
        """Return display name (client or public requester)."""
        if self.client:
            return self.client.full_name
        return self.requested_by_name or self.requested_by_email or 'Sin nombre'

    @property
    def is_synced_with_google(self):
        """Check if appointment is synced with Google Calendar."""
        return bool(self.google_calendar_id)
