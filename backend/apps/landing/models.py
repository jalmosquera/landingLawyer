"""
Landing page models for public website content.

This module defines models for managing public-facing content including
services, testimonials, success cases, and contact requests.
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Service(models.Model):
    """
    Service model for displaying law firm services on landing page.

    Attributes:
        title: Service name (e.g., "Derecho Civil")
        description: Detailed description of the service
        icon: Icon identifier (FontAwesome class or image path)
        order: Display order on landing page
        is_active: Whether to show on public website

    Example:
        >>> service = Service.objects.create(
        ...     title='Derecho Familiar',
        ...     description='Divorcios, custodia, pensiones alimenticias',
        ...     icon='fa-users',
        ...     order=1,
        ...     is_active=True
        ... )
    """

    title = models.CharField('Título', max_length=100)
    description = models.TextField('Descripción')
    icon = models.CharField(
        'Icono',
        max_length=100,
        blank=True,
        help_text='Clase de FontAwesome (ej: fa-gavel) o ruta de imagen'
    )
    order = models.PositiveIntegerField(
        'Orden',
        default=0,
        help_text='Orden de visualización (menor número = primero)'
    )
    is_active = models.BooleanField(
        'Activo',
        default=True,
        help_text='Si está activo, se muestra en la landing page'
    )

    class Meta:
        db_table = 'landing_services'
        verbose_name = 'Servicio'
        verbose_name_plural = 'Servicios'
        ordering = ['order', 'title']
        indexes = [
            models.Index(fields=['is_active', 'order']),
        ]

    def __str__(self):
        """Return service title."""
        return self.title


class Testimonial(models.Model):
    """
    Testimonial model for client reviews and feedback.

    Attributes:
        client_name: Name of the client (can be partial/anonymous)
        text: Testimonial content
        rating: Rating from 1 to 5 stars
        date: Date of the testimonial
        is_active: Whether to show on public website
        order: Display order

    Example:
        >>> testimonial = Testimonial.objects.create(
        ...     client_name='Juan P.',
        ...     text='Excelente servicio, muy profesional',
        ...     rating=5,
        ...     date=date.today(),
        ...     is_active=True
        ... )
    """

    client_name = models.CharField(
        'Nombre del cliente',
        max_length=100,
        help_text='Puede ser nombre parcial para privacidad (ej: Juan P.)'
    )
    text = models.TextField(
        'Testimonio',
        help_text='Contenido del testimonio'
    )
    rating = models.PositiveSmallIntegerField(
        'Calificación',
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ],
        help_text='Calificación de 1 a 5 estrellas'
    )
    date = models.DateField('Fecha')
    is_active = models.BooleanField(
        'Activo',
        default=True,
        help_text='Si está activo, se muestra en la landing page'
    )
    order = models.PositiveIntegerField(
        'Orden',
        default=0,
        help_text='Orden de visualización'
    )

    class Meta:
        db_table = 'landing_testimonials'
        verbose_name = 'Testimonio'
        verbose_name_plural = 'Testimonios'
        ordering = ['order', '-date']
        indexes = [
            models.Index(fields=['is_active', 'order']),
            models.Index(fields=['rating']),
        ]

    def __str__(self):
        """Return client name and rating."""
        stars = '★' * self.rating
        return f"{self.client_name} - {stars}"


class SuccessCase(models.Model):
    """
    Success case model for showcasing law firm victories.

    Attributes:
        title: Case title (anonymized, no sensitive info)
        description: Brief description of the case
        case_type: Type of legal matter
        result: Outcome achieved
        date: Date of resolution
        is_active: Whether to show on public website
        order: Display order

    Example:
        >>> success_case = SuccessCase.objects.create(
        ...     title='Divorcio en Tiempo Récord',
        ...     description='Divorcio voluntario completado en solo 3 meses',
        ...     case_type='Familiar',
        ...     result='Divorcio decretado con acuerdo mutuo satisfactorio',
        ...     date=date(2024, 11, 1),
        ...     is_active=True
        ... )
    """

    title = models.CharField(
        'Título',
        max_length=200,
        help_text='Título del caso (sin datos sensibles)'
    )
    description = models.TextField(
        'Descripción',
        help_text='Descripción breve del caso'
    )
    case_type = models.CharField(
        'Tipo de caso',
        max_length=100,
        help_text='Tipo de materia (Civil, Penal, Familiar, etc.)'
    )
    result = models.TextField(
        'Resultado',
        help_text='Resultado obtenido'
    )
    date = models.DateField(
        'Fecha',
        help_text='Fecha de resolución'
    )
    is_active = models.BooleanField(
        'Activo',
        default=True,
        help_text='Si está activo, se muestra en la landing page'
    )
    order = models.PositiveIntegerField(
        'Orden',
        default=0,
        help_text='Orden de visualización'
    )

    class Meta:
        db_table = 'landing_success_cases'
        verbose_name = 'Caso de Éxito'
        verbose_name_plural = 'Casos de Éxito'
        ordering = ['order', '-date']
        indexes = [
            models.Index(fields=['is_active', 'order']),
            models.Index(fields=['case_type']),
        ]

    def __str__(self):
        """Return case title."""
        return self.title


class ContactRequest(models.Model):
    """
    Contact request model for public inquiry form submissions.

    Attributes:
        name: Name of the person contacting
        email: Email address
        phone: Phone number (optional)
        subject: Subject of inquiry
        message: Detailed message
        request_type: Type of request (consultation, appointment, other)
        status: Current status of the request
        assigned_to: Staff member assigned to handle it
        internal_notes: Private notes for staff
        created_at: When request was submitted

    Example:
        >>> contact_request = ContactRequest.objects.create(
        ...     name='María García',
        ...     email='maria@example.com',
        ...     phone='+52155512345',
        ...     subject='Consulta sobre divorcio',
        ...     message='Quisiera agendar una consulta...',
        ...     request_type='consultation'
        ... )
    """

    REQUEST_TYPE_CHOICES = [
        ('consultation', 'Consulta'),
        ('appointment', 'Solicitud de Cita'),
        ('information', 'Información'),
        ('other', 'Otro'),
    ]

    STATUS_CHOICES = [
        ('new', 'Nueva'),
        ('in_progress', 'En Proceso'),
        ('contacted', 'Contactado'),
        ('converted', 'Convertido a Cliente'),
        ('closed', 'Cerrada'),
    ]

    # Contact information
    name = models.CharField('Nombre', max_length=200)
    email = models.EmailField('Correo electrónico')
    phone = models.CharField(
        'Teléfono',
        max_length=20,
        blank=True
    )

    # Request details
    subject = models.CharField('Asunto', max_length=200)
    message = models.TextField('Mensaje')
    request_type = models.CharField(
        'Tipo de solicitud',
        max_length=20,
        choices=REQUEST_TYPE_CHOICES,
        default='consultation'
    )

    # Processing
    status = models.CharField(
        'Estado',
        max_length=20,
        choices=STATUS_CHOICES,
        default='new'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_contact_requests',
        limit_choices_to={'role__in': ['boss', 'employe']},
        verbose_name='Asignado a'
    )
    internal_notes = models.TextField(
        'Notas internas',
        blank=True,
        help_text='Notas visibles solo para el staff'
    )

    # Timestamp
    created_at = models.DateTimeField(
        'Fecha de solicitud',
        auto_now_add=True,
        db_index=True
    )

    class Meta:
        db_table = 'landing_contact_requests'
        verbose_name = 'Solicitud de Contacto'
        verbose_name_plural = 'Solicitudes de Contacto'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['request_type']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        """Return name and subject."""
        return f"{self.name} - {self.subject}"

    @property
    def is_new(self):
        """Check if request is new (not yet processed)."""
        return self.status == 'new'

    @property
    def is_converted(self):
        """Check if request was converted to a client."""
        return self.status == 'converted'
