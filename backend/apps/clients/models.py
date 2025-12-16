"""
Client model for managing law firm clients.

This module defines the Client model which represents individuals or entities
who are clients of the law firm. Clients can optionally be linked to User accounts
for portal access.
"""

from django.db import models
from django.conf import settings


class Client(models.Model):
    """
    Client model representing a law firm client.

    Clients are individuals or entities who have legal matters with the firm.
    They can optionally be linked to a User account (with role='client') to
    access the client portal.

    Attributes:
        user: Optional link to User account for portal access
        full_name: Client's complete legal name
        email: Primary email for communications
        phone: Primary phone number
        identification_type: Type of ID document (INE, Passport, RFC, etc.)
        identification_number: ID document number
        address: Street address
        city: City or locality
        state: State or province
        postal_code: ZIP/postal code
        notes: Internal notes (not visible to client)
        created_at: Timestamp when client was added
        updated_at: Timestamp of last modification
        created_by: Staff member who created the client record

    Example:
        >>> client = Client.objects.create(
        ...     full_name='Juan Pérez García',
        ...     email='juan@example.com',
        ...     phone='+52155512345',
        ...     created_by=staff_user
        ... )
    """

    IDENTIFICATION_TYPE_CHOICES = [
        ('ine', 'INE/IFE'),
        ('passport', 'Pasaporte'),
        ('rfc', 'RFC'),
        ('curp', 'CURP'),
        ('other', 'Otro'),
    ]

    # Optional link to User for portal access
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='client_profile',
        limit_choices_to={'role': 'client'},
        help_text='Usuario vinculado para acceso al portal'
    )

    # Personal information
    full_name = models.CharField('Nombre completo', max_length=200)
    email = models.EmailField('Correo electrónico')
    phone = models.CharField('Teléfono', max_length=20)

    # Identification
    identification_type = models.CharField(
        'Tipo de identificación',
        max_length=20,
        choices=IDENTIFICATION_TYPE_CHOICES,
        default='ine'
    )
    identification_number = models.CharField(
        'Número de identificación',
        max_length=50,
        blank=True
    )

    # Address
    address = models.CharField('Dirección', max_length=250, blank=True)
    city = models.CharField('Ciudad', max_length=100, blank=True)
    state = models.CharField('Estado', max_length=100, blank=True)
    postal_code = models.CharField('Código postal', max_length=10, blank=True)

    # Internal notes
    notes = models.TextField(
        'Notas internas',
        blank=True,
        help_text='Notas visibles solo para el staff'
    )

    # Audit fields
    created_at = models.DateTimeField('Fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última actualización', auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_clients',
        limit_choices_to={'role__in': ['boss', 'employe']},
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'clients'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['full_name']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        """Return client's full name."""
        return self.full_name

    @property
    def has_portal_access(self):
        """Check if client has portal access (linked to User)."""
        return self.user is not None

    @property
    def active_cases_count(self):
        """Count active cases for this client."""
        return self.cases.filter(status__in=['open', 'in_progress']).count()
