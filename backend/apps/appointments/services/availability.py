"""
Availability service for calculating available appointment slots.

Calculates free time slots based on:
- LawyerAvailability configuration in database
- Existing appointments in database
- Business hours configuration (fallback)
"""

from datetime import datetime, timedelta, time
from django.utils import timezone
from django.conf import settings
from apps.appointments.models import Appointment, LawyerAvailability


class AvailabilityService:
    """Service for calculating available appointment slots."""

    def __init__(self, lawyer=None):
        """
        Initialize availability service.

        Args:
            lawyer: User instance (optional). If provided, uses lawyer's availability config.
                   If None, uses first available lawyer or settings fallback.
        """
        self.lawyer = lawyer

        # Fallback to settings if no lawyer or no availability configured
        self.business_start_fallback = getattr(settings, 'BUSINESS_HOURS_START', time(9, 0))
        self.business_end_fallback = getattr(settings, 'BUSINESS_HOURS_END', time(18, 0))
        self.default_duration_fallback = getattr(settings, 'DEFAULT_APPOINTMENT_DURATION', 60)

        # Convert string to time object if needed (fallback)
        if isinstance(self.business_start_fallback, str):
            hour, minute = map(int, self.business_start_fallback.split(':'))
            self.business_start_fallback = time(hour, minute)
        if isinstance(self.business_end_fallback, str):
            hour, minute = map(int, self.business_end_fallback.split(':'))
            self.business_end_fallback = time(hour, minute)

    def get_available_slots(self, date, duration_minutes=None):
        """
        Get available time slots for a specific date.

        Args:
            date: Date object or datetime to check
            duration_minutes: Duration of appointment in minutes (default: from lawyer config or settings)

        Returns:
            list: List of dicts with {start_time, end_time, available: bool, lawyer_id}
        """
        # Convert date to datetime if needed
        if isinstance(date, datetime):
            target_date = date.date()
        else:
            target_date = date

        # Check if date is in the past
        today = timezone.now().date()
        if target_date < today:
            return []

        day_of_week = target_date.weekday()

        # Get availability configuration from database
        availability_query = LawyerAvailability.objects.filter(
            day_of_week=day_of_week,
            is_active=True
        )

        # Filter by lawyer if provided
        if self.lawyer:
            availability_query = availability_query.filter(lawyer=self.lawyer)

        availability_configs = list(availability_query.select_related('lawyer'))

        # If no configuration found, return empty (no availability)
        if not availability_configs:
            return []

        all_slots = []

        # Generate slots for each availability configuration
        for config in availability_configs:
            slot_duration = duration_minutes or config.slot_duration_minutes

            # Generate slots for this config
            slots = self._generate_slots_for_config(
                target_date,
                config.start_time,
                config.end_time,
                slot_duration,
                config.lawyer
            )

            # Get existing appointments for this lawyer on this date
            existing_appointments = Appointment.objects.filter(
                starts_at__date=target_date,
                status__in=['pending', 'confirmed']
            ).values('starts_at', 'ends_at')

            # Mark slots as available or not
            for slot in slots:
                slot['available'] = self._is_slot_available(
                    slot['start_time'],
                    slot['end_time'],
                    existing_appointments
                )
                slot['lawyer_id'] = config.lawyer.id
                slot['lawyer_name'] = config.lawyer.get_full_name()

            all_slots.extend(slots)

        # Sort by start time
        all_slots.sort(key=lambda x: x['start_time'])

        return all_slots

    def _generate_slots_for_config(self, date, start_time, end_time, duration_minutes, lawyer):
        """
        Generate time slots for a specific availability configuration.

        Args:
            date: Date object
            start_time: Time object (business start)
            end_time: Time object (business end)
            duration_minutes: Duration of each slot
            lawyer: User instance

        Returns:
            list: List of dicts with start_time and end_time
        """
        slots = []
        current_time = datetime.combine(date, start_time)
        end_of_day = datetime.combine(date, end_time)

        # Make timezone-aware
        current_time = timezone.make_aware(current_time)
        end_of_day = timezone.make_aware(end_of_day)

        while current_time + timedelta(minutes=duration_minutes) <= end_of_day:
            slot_end = current_time + timedelta(minutes=duration_minutes)

            # If it's today, skip past slots
            if date == timezone.now().date():
                if current_time < timezone.now():
                    current_time = slot_end
                    continue

            slots.append({
                'start_time': current_time,
                'end_time': slot_end,
                'available': True  # Will be updated later
            })

            current_time = slot_end

        return slots

    def _is_slot_available(self, start_time, end_time, existing_appointments):
        """
        Check if a time slot is available (no conflicts).

        Args:
            start_time: Slot start datetime
            end_time: Slot end datetime
            existing_appointments: QuerySet of existing appointments

        Returns:
            bool: True if slot is available
        """
        for apt in existing_appointments:
            # Check for overlap
            if (start_time < apt['ends_at'] and end_time > apt['starts_at']):
                return False

        return True

    def get_next_available_slot(self, duration_minutes=None, days_ahead=7):
        """
        Get the next available appointment slot.

        Args:
            duration_minutes: Duration of appointment
            days_ahead: Number of days to search ahead

        Returns:
            dict: {'start_time': datetime, 'end_time': datetime} or None
        """
        if duration_minutes is None:
            duration_minutes = self.default_duration

        current_date = timezone.now().date()

        for day_offset in range(days_ahead):
            check_date = current_date + timedelta(days=day_offset)
            slots = self.get_available_slots(check_date, duration_minutes)

            # Find first available slot
            for slot in slots:
                if slot['available']:
                    return {
                        'start_time': slot['start_time'],
                        'end_time': slot['end_time']
                    }

        return None

    def is_time_available(self, start_time, end_time):
        """
        Check if a specific time range is available.

        Args:
            start_time: Datetime
            end_time: Datetime

        Returns:
            bool: True if time is available
        """
        # Get the day of week for the requested time
        day_of_week = start_time.weekday()

        # Check if there's any active availability configuration for this day
        availability_configs = LawyerAvailability.objects.filter(
            day_of_week=day_of_week,
            is_active=True
        )

        if self.lawyer:
            availability_configs = availability_configs.filter(lawyer=self.lawyer)

        # If no availability configured for this day, it's not available
        if not availability_configs.exists():
            return False

        # Check if the requested time falls within any availability window
        time_in_range = False
        for config in availability_configs:
            if config.start_time <= start_time.time() and end_time.time() <= config.end_time:
                time_in_range = True
                break

        if not time_in_range:
            return False

        # Check for conflicts with existing appointments
        conflicts = Appointment.objects.filter(
            starts_at__lt=end_time,
            ends_at__gt=start_time,
            status__in=['pending', 'confirmed']
        ).exists()

        return not conflicts
