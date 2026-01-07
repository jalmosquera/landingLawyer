"""
Case model for managing legal cases.

This module defines the Case model which represents legal matters/expedientes
handled by the law firm for their clients.
"""

from django.db import models
from django.conf import settings
from django.utils import timezone


class Case(models.Model):
    """
    Case model representing a legal matter or expediente.

    A case is the core entity linking clients to their legal matters,
    documents, appointments, and assigned staff members.

    Attributes:
        client: Client this case belongs to
        assigned_to: Staff member responsible for the case
        case_number: Unique identifier (e.g., "CASE-2024-001")
        title: Short descriptive title
        description: Detailed case description
        case_type: Type of legal matter
        status: Current case status
        priority: Priority level
        opened_at: Date when case was opened
        closed_at: Date when case was closed (if applicable)
        internal_notes: Private notes for staff
        created_at: Timestamp when record was created
        updated_at: Timestamp of last modification
        created_by: Staff member who created the case
        updated_by: Staff member who last updated the case

    Example:
        >>> case = Case.objects.create(
        ...     client=client,
        ...     assigned_to=lawyer,
        ...     case_number='CASE-2024-001',
        ...     title='Divorcio Voluntario',
        ...     case_type='familiar',
        ...     created_by=staff_user
        ... )
    """

    CASE_TYPE_CHOICES = [
        ('civil', 'Civil'),
        ('penal', 'Penal'),
        ('laboral', 'Laboral'),
        ('familiar', 'Familiar'),
        ('mercantil', 'Mercantil'),
        ('administrativo', 'Administrativo'),
        ('otro', 'Otro'),
    ]

    STATUS_CHOICES = [
        ('open', 'Abierto'),
        ('in_progress', 'En Proceso'),
        ('closed', 'Cerrado'),
        ('archived', 'Archivado'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('medium', 'Media'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]

    # Relationships
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,  # Prevent deletion of clients with cases
        related_name='cases',
        verbose_name='Cliente'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_cases',
        limit_choices_to={'role__in': ['boss', 'employe']},
        verbose_name='Asignado a'
    )

    # Case identification
    case_number = models.CharField(
        'Número de caso',
        max_length=50,
        unique=True,
        db_index=True,
        help_text='Identificador único del caso (ej: CASE-2024-001)'
    )

    # Case details
    title = models.CharField('Título', max_length=200)
    description = models.TextField('Descripción')
    case_type = models.CharField(
        'Tipo de caso',
        max_length=20,
        choices=CASE_TYPE_CHOICES,
        default='civil'
    )
    status = models.CharField(
        'Estado',
        max_length=20,
        choices=STATUS_CHOICES,
        default='open'
    )
    priority = models.CharField(
        'Prioridad',
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium'
    )

    # Dates
    opened_at = models.DateField(
        'Fecha de apertura',
        default=timezone.now,
        help_text='Fecha en que se abrió el caso'
    )
    closed_at = models.DateField(
        'Fecha de cierre',
        null=True,
        blank=True,
        help_text='Fecha en que se cerró el caso'
    )

    # Internal information
    internal_notes = models.TextField(
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
        related_name='created_cases',
        limit_choices_to={'role__in': ['boss', 'employe']},
        verbose_name='Creado por'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_cases',
        limit_choices_to={'role__in': ['boss', 'employe']},
        verbose_name='Actualizado por'
    )

    class Meta:
        db_table = 'cases'
        verbose_name = 'Caso'
        verbose_name_plural = 'Casos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case_number']),
            models.Index(fields=['client', 'status']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['opened_at']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        """Return case number and title."""
        return f"{self.case_number} - {self.title}"

    def save(self, *args, **kwargs):
        """Override save to auto-generate case_number and handle case closure."""
        # Auto-generate case_number if not provided
        if not self.case_number:
            import re
            from django.db.models import Max
            current_year = timezone.now().year

            # Sanitize title to create a clean prefix
            # Remove accents, special characters, and convert to uppercase
            title_clean = self.title.upper()
            # Replace common Spanish accented characters
            replacements = {
                'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
                'Ñ': 'N', 'Ü': 'U'
            }
            for accented, plain in replacements.items():
                title_clean = title_clean.replace(accented, plain)

            # Keep only letters and spaces, then take first words
            title_clean = re.sub(r'[^A-Z\s]', '', title_clean)
            # Take first 3 words or first 20 characters, whichever is shorter
            words = title_clean.split()
            if len(words) >= 3:
                title_prefix = '-'.join(words[:3])
            elif len(words) == 2:
                title_prefix = '-'.join(words[:2])
            else:
                title_prefix = words[0] if words else 'CASO'

            # Limit to 30 characters
            title_prefix = title_prefix[:30]

            prefix = f'{title_prefix}-CASE-{current_year}-'

            # Find all case numbers with similar prefix and extract the highest number
            # Look for any case number that ends with -CASE-{year}-XXX pattern
            pattern_prefix = f'-CASE-{current_year}-'
            cases_this_year = Case.objects.filter(
                case_number__contains=pattern_prefix
            ).values_list('case_number', flat=True)

            max_number = 0
            for case_number in cases_this_year:
                try:
                    # Extract the number part from the end (last 3 digits)
                    parts = case_number.split(pattern_prefix)
                    if len(parts) > 1:
                        number_part = parts[-1]
                        current_number = int(number_part)
                        if current_number > max_number:
                            max_number = current_number
                except (ValueError, AttributeError, IndexError):
                    continue

            next_number = max_number + 1
            # Format: DIVORCIO-VOLUNTARIO-CASE-2025-001
            self.case_number = f'{prefix}{next_number:03d}'

        # Auto-close case when status changes to closed
        if self.status == 'closed' and not self.closed_at:
            self.closed_at = timezone.now().date()
        elif self.status != 'closed' and self.closed_at:
            # Reopen case
            self.closed_at = None

        super().save(*args, **kwargs)

    @property
    def is_active(self):
        """Check if case is currently active (not closed or archived)."""
        return self.status in ['open', 'in_progress']

    @property
    def document_count(self):
        """Count total documents attached to this case."""
        return self.documents.count()

    @property
    def appointment_count(self):
        """Count total appointments for this case."""
        return self.appointments.count()

    @property
    def days_open(self):
        """Calculate number of days case has been open."""
        end_date = self.closed_at or timezone.now().date()
        return (end_date - self.opened_at).days
