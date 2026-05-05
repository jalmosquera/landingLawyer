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


class SiteSettings(models.Model):
    """
    Singleton model for site-wide settings including payment control.

    Allows the admin to set a payment deadline. If today's date exceeds
    the deadline (or if manually disabled), the public site shows a
    maintenance/payment-required page instead of the normal content.

    Only one instance of this model should exist (use get_settings()).

    Attributes:
        payment_deadline: Date after which the site is auto-disabled if unpaid.
        is_manually_disabled: Override to disable the site regardless of date.
        maintenance_title: Title shown on the disabled page.
        maintenance_message: Message shown to visitors when site is disabled.
        contact_email: Contact email displayed on the disabled page.
        updated_at: Last modification timestamp.

    Example:
        >>> settings = SiteSettings.get_settings()
        >>> settings.payment_deadline = date(2026, 5, 1)
        >>> settings.save()
        >>> settings.is_site_active  # False if today > May 1st 2026
    """

    payment_deadline = models.DateField(
        'Fecha límite de pago',
        null=True,
        blank=True,
        help_text=(
            'Si hoy supera esta fecha y el sitio no está pagado, '
            'se mostrará la página de mantenimiento automáticamente.'
        )
    )
    is_manually_disabled = models.BooleanField(
        'Deshabilitar manualmente',
        default=False,
        help_text='Activa esta opción para deshabilitar el sitio de inmediato, sin importar la fecha.'
    )
    maintenance_title = models.CharField(
        'Título de la página de mantenimiento',
        max_length=200,
        default='Tu sitio web está temporalmente suspendido',
    )
    maintenance_message = models.TextField(
        'Mensaje para los visitantes',
        default=(
            'El acceso a este sitio ha sido suspendido. '
            'Si sos el titular, regularizá tu situación de pago para reactivarlo de inmediato. '
            'Una vez confirmado el pago, el sitio estará disponible nuevamente en minutos.'
        ),
        help_text='Texto que verán los visitantes cuando el sitio esté inhabilitado.'
    )
    contact_email = models.EmailField(
        'Correo de contacto',
        blank=True,
        help_text='Correo que se mostrará en la página de mantenimiento.'
    )
    updated_at = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        db_table = 'landing_site_settings'
        verbose_name = 'Configuración del Sitio'
        verbose_name_plural = 'Configuración del Sitio'

    def __str__(self):
        status = '🔴 Deshabilitado' if not self.is_site_active else '🟢 Activo'
        deadline = self.payment_deadline.strftime('%d/%m/%Y') if self.payment_deadline else 'Sin fecha'
        return f"Configuración del sitio — {status} · Fecha límite: {deadline}"

    @property
    def is_site_active(self):
        """Return True if the site should be publicly accessible."""
        if self.is_manually_disabled:
            return False
        if self.payment_deadline:
            from django.utils import timezone
            return timezone.now().date() <= self.payment_deadline
        return True

    @classmethod
    def get_settings(cls):
        """Return the singleton settings instance, creating it if needed."""
        instance, _ = cls.objects.get_or_create(pk=1)
        return instance
