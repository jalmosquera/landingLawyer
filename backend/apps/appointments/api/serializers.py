"""
Appointment API serializers.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.appointments.models import Appointment, LawyerAvailability
from apps.clients.api.serializers import ClientMinimalSerializer
from apps.cases.api.serializers import CaseMinimalSerializer

User = get_user_model()


class AppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Appointment model with full details.

    Used for listing and retrieving appointment information.
    """

    client_data = ClientMinimalSerializer(source='client', read_only=True, allow_null=True)
    case_data = CaseMinimalSerializer(source='case', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True, allow_null=True)
    appointment_type_display = serializers.CharField(source='get_appointment_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_public_request = serializers.BooleanField(read_only=True)
    duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'client',
            'client_data',
            'case',
            'case_data',
            'requested_by_email',
            'requested_by_name',
            'requested_by_phone',
            'starts_at',
            'ends_at',
            'duration_minutes',
            'title',
            'description',
            'appointment_type',
            'appointment_type_display',
            'status',
            'status_display',
            'location',
            'google_calendar_id',
            'google_meet_link',
            'teams_meeting_link',
            'last_sync_at',
            'internal_notes',
            'is_public_request',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
        ]
        read_only_fields = [
            'id',
            'google_calendar_id',
            'google_meet_link',
            'teams_meeting_link',
            'last_sync_at',
            'created_at',
            'updated_at',
            'created_by'
        ]

    def get_duration_minutes(self, obj):
        """Calculate duration in minutes."""
        if obj.starts_at and obj.ends_at:
            delta = obj.ends_at - obj.starts_at
            return int(delta.total_seconds() / 60)
        return None


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new appointments (staff only).

    Validates time ranges and checks for conflicts.
    """

    class Meta:
        model = Appointment
        fields = [
            'client',
            'case',
            'starts_at',
            'ends_at',
            'title',
            'description',
            'appointment_type',
            'status',
            'location',
            'internal_notes',
        ]

    def validate(self, data):
        """Validate appointment data."""
        starts_at = data.get('starts_at')
        ends_at = data.get('ends_at')

        # Validate time range
        if starts_at and ends_at:
            if ends_at <= starts_at:
                raise serializers.ValidationError(
                    "La hora de fin debe ser posterior a la hora de inicio."
                )

            # Check minimum duration (15 minutes)
            duration = (ends_at - starts_at).total_seconds() / 60
            if duration < 15:
                raise serializers.ValidationError(
                    "La duración mínima de una cita es 15 minutos."
                )

            # Check if start time is in the past
            if starts_at < timezone.now():
                raise serializers.ValidationError(
                    "No se pueden crear citas en el pasado."
                )

            # Check for conflicts (optional - can be disabled if overbooking is allowed)
            conflicts = Appointment.objects.filter(
                starts_at__lt=ends_at,
                ends_at__gt=starts_at,
                status__in=['pending', 'confirmed']
            )

            # Exclude current instance if updating
            if self.instance:
                conflicts = conflicts.exclude(pk=self.instance.pk)

            if conflicts.exists():
                raise serializers.ValidationError(
                    f"Conflicto de horario. Ya existe una cita en este horario: {conflicts.first().title}"
                )

        return data

    def create(self, validated_data):
        """Create appointment and set created_by."""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing appointments.
    """

    class Meta:
        model = Appointment
        fields = [
            'client',
            'case',
            'starts_at',
            'ends_at',
            'title',
            'description',
            'appointment_type',
            'status',
            'location',
            'internal_notes',
        ]

    def validate(self, data):
        """Validate appointment data."""
        starts_at = data.get('starts_at', self.instance.starts_at if self.instance else None)
        ends_at = data.get('ends_at', self.instance.ends_at if self.instance else None)

        if starts_at and ends_at:
            if ends_at <= starts_at:
                raise serializers.ValidationError(
                    "La hora de fin debe ser posterior a la hora de inicio."
                )

            # Check for conflicts
            conflicts = Appointment.objects.filter(
                starts_at__lt=ends_at,
                ends_at__gt=starts_at,
                status__in=['pending', 'confirmed']
            )

            if self.instance:
                conflicts = conflicts.exclude(pk=self.instance.pk)

            if conflicts.exists():
                raise serializers.ValidationError(
                    f"Conflicto de horario con: {conflicts.first().title}"
                )

        return data


class AppointmentMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal appointment serializer for nested representations.
    """

    client_data = ClientMinimalSerializer(source='client', read_only=True, allow_null=True)
    case_data = CaseMinimalSerializer(source='case', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    appointment_type_display = serializers.CharField(source='get_appointment_type_display', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id',
            'client',
            'client_data',
            'case',
            'case_data',
            'requested_by_name',
            'title',
            'starts_at',
            'ends_at',
            'appointment_type',
            'appointment_type_display',
            'status',
            'status_display',
            'location',
        ]
        read_only_fields = fields


class PublicAppointmentRequestSerializer(serializers.Serializer):
    """
    Serializer for public appointment requests (no authentication required).

    Used when clients request appointments through the public calendar.
    """

    requested_by_name = serializers.CharField(
        max_length=200,
        required=True,
        help_text='Nombre completo'
    )
    requested_by_email = serializers.EmailField(
        required=True,
        help_text='Correo electrónico'
    )
    requested_by_phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        help_text='Teléfono de contacto'
    )
    starts_at = serializers.DateTimeField(
        required=True,
        help_text='Fecha y hora de inicio'
    )
    ends_at = serializers.DateTimeField(
        required=True,
        help_text='Fecha y hora de fin'
    )
    message = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Mensaje adicional (opcional)'
    )

    def validate(self, data):
        """Validate public appointment request."""
        starts_at = data['starts_at']
        ends_at = data['ends_at']

        # FORCE: All public appointment requests are Microsoft Teams
        data['appointment_type'] = 'teams'

        if ends_at <= starts_at:
            raise serializers.ValidationError(
                "La hora de fin debe ser posterior a la hora de inicio."
            )

        if starts_at < timezone.now():
            raise serializers.ValidationError(
                "No se pueden solicitar citas en el pasado."
            )

        # Check if slot is available
        from apps.appointments.services.availability import AvailabilityService
        availability_service = AvailabilityService()

        if not availability_service.is_time_available(starts_at, ends_at):
            raise serializers.ValidationError(
                "El horario seleccionado no está disponible. Por favor selecciona otro."
            )

        return data


class AvailableSlotSerializer(serializers.Serializer):
    """
    Serializer for available time slots.

    Used in public calendar to show available appointment times.
    """

    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    available = serializers.BooleanField()
    duration_minutes = serializers.IntegerField(read_only=True)
    lawyer_id = serializers.IntegerField(read_only=True, required=False)
    lawyer_name = serializers.CharField(read_only=True, required=False)


class LawyerAvailabilitySerializer(serializers.ModelSerializer):
    """
    Serializer for LawyerAvailability model.

    Used for managing lawyer availability configuration.
    """

    lawyer_name = serializers.CharField(source='lawyer.get_full_name', read_only=True)
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = LawyerAvailability
        fields = [
            'id',
            'lawyer',
            'lawyer_name',
            'day_of_week',
            'day_of_week_display',
            'start_time',
            'end_time',
            'is_active',
            'slot_duration_minutes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        """Validate availability data."""
        if 'end_time' in data and 'start_time' in data:
            if data['end_time'] <= data['start_time']:
                raise serializers.ValidationError({
                    'end_time': 'La hora de fin debe ser posterior a la hora de inicio'
                })

        if 'slot_duration_minutes' in data:
            if data['slot_duration_minutes'] not in [15, 30, 45, 60, 90, 120]:
                raise serializers.ValidationError({
                    'slot_duration_minutes': 'La duración debe ser 15, 30, 45, 60, 90 o 120 minutos'
                })

        return data


class LawyerAvailabilityCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating LawyerAvailability.

    Auto-assigns the current user as the lawyer.
    """

    class Meta:
        model = LawyerAvailability
        fields = [
            'day_of_week',
            'start_time',
            'end_time',
            'is_active',
            'slot_duration_minutes',
        ]

    def create(self, validated_data):
        """Create availability with current user as lawyer."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['lawyer'] = request.user
        return super().create(validated_data)

    def validate(self, data):
        """Validate availability data."""
        if data['end_time'] <= data['start_time']:
            raise serializers.ValidationError({
                'end_time': 'La hora de fin debe ser posterior a la hora de inicio'
            })

        if data['slot_duration_minutes'] not in [15, 30, 45, 60, 90, 120]:
            raise serializers.ValidationError({
                'slot_duration_minutes': 'La duración debe ser 15, 30, 45, 60, 90 o 120 minutos'
            })

        return data
