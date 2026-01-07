"""
Management command to seed lawyer availability data.

Usage: python manage.py seed_availability
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.appointments.models import LawyerAvailability
from datetime import time

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds lawyer availability data for testing'

    def handle(self, *args, **kwargs):
        # Get all staff users (boss/employe)
        lawyers = User.objects.filter(role__in=['boss', 'employe'])

        if not lawyers.exists():
            self.stdout.write(self.style.ERROR('No lawyers found. Create a boss or employe user first.'))
            return

        # Clear existing availability
        deleted_count = LawyerAvailability.objects.all().count()
        LawyerAvailability.objects.all().delete()
        self.stdout.write(self.style.WARNING(f'Deleted {deleted_count} existing availability records'))

        created_count = 0

        for lawyer in lawyers:
            self.stdout.write(f'\nCreating availability for: {lawyer.get_full_name()}')

            # Monday to Friday: 9:00-13:00 and 15:00-18:00
            for day in range(5):  # 0-4 (Mon-Fri)
                # Morning slot
                LawyerAvailability.objects.create(
                    lawyer=lawyer,
                    day_of_week=day,
                    start_time=time(9, 0),
                    end_time=time(13, 0),
                    slot_duration_minutes=60,
                    is_active=True
                )
                created_count += 1

                # Afternoon slot
                LawyerAvailability.objects.create(
                    lawyer=lawyer,
                    day_of_week=day,
                    start_time=time(15, 0),
                    end_time=time(18, 0),
                    slot_duration_minutes=60,
                    is_active=True
                )
                created_count += 1

            self.stdout.write(self.style.SUCCESS(f'  ✓ Created 10 availability slots (Mon-Fri, morning & afternoon)'))

        self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully created {created_count} availability records for {lawyers.count()} lawyer(s)'))
        self.stdout.write(self.style.SUCCESS('Now you can test the availability system!'))
