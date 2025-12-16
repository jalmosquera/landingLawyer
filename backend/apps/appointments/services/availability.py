"""
Availability service for calculating available appointment slots.

Calculates free time slots based on:
- Existing appointments in database
- Business hours configuration
- Blocked times (optional)
"""

from datetime import datetime, timedelta, time
from django.utils import timezone
from django.conf import settings
from apps.appointments.models import Appointment


class AvailabilityService:
    """Service for calculating available appointment slots."""

    def __init__(self):
        """Initialize availability service with business hours."""
        # Default business hours: 9 AM - 6 PM
        self.business_start = getattr(settings, 'BUSINESS_HOURS_START', time(9, 0))
        self.business_end = getattr(settings, 'BUSINESS_HOURS_END', time(18, 0))
        # Default slot duration: 60 minutes
        self.default_duration = getattr(settings, 'DEFAULT_APPOINTMENT_DURATION', 60)
        # Days of week (0 = Monday, 6 = Sunday)
        # Default: Monday to Friday
        self.working_days = getattr(settings, 'WORKING_DAYS', [0, 1, 2, 3, 4])

    def get_available_slots(self, date, duration_minutes=None):
        """
        Get available time slots for a specific date.

        Args:
            date: Date object or datetime to check
            duration_minutes: Duration of appointment in minutes (default: from settings)

        Returns:
            list: List of dicts with {start_time, end_time, available: bool}
        """
        if duration_minutes is None:
            duration_minutes = self.default_duration

        # Convert date to datetime if needed
        if isinstance(date, datetime):
            target_date = date.date()
        else:
            target_date = date

        # Check if date is a working day
        if target_date.weekday() not in self.working_days:
            return []

        # Check if date is in the past
        today = timezone.now().date()
        if target_date < today:
            return []

        # Generate all possible slots for the day
        slots = self._generate_slots(target_date, duration_minutes)

        # Get existing appointments for this date
        existing_appointments = Appointment.objects.filter(
            starts_at__date=target_date,
            status__in=['pending', 'confirmed']  # Don't block on cancelled
        ).values('starts_at', 'ends_at')

        # Mark slots as available or not
        for slot in slots:
            slot['available'] = self._is_slot_available(
                slot['start_time'],
                slot['end_time'],
                existing_appointments
            )

        return slots

    def _generate_slots(self, date, duration_minutes):
        """
        Generate all possible time slots for a date.

        Args:
            date: Date object
            duration_minutes: Duration of each slot

        Returns:
            list: List of dicts with start_time and end_time
        """
        slots = []
        current_time = datetime.combine(date, self.business_start)
        end_of_day = datetime.combine(date, self.business_end)

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
        # Check if it's within business hours
        if start_time.time() < self.business_start or end_time.time() > self.business_end:
            return False

        # Check if it's a working day
        if start_time.weekday() not in self.working_days:
            return False

        # Check for conflicts
        conflicts = Appointment.objects.filter(
            starts_at__lt=end_time,
            ends_at__gt=start_time,
            status__in=['pending', 'confirmed']
        ).exists()

        return not conflicts
