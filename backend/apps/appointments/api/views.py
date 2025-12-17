"""
Appointment API views.
"""

from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime, timedelta

from apps.appointments.models import Appointment
from apps.appointments.services.google_calendar import GoogleCalendarService
from apps.appointments.services.availability import AvailabilityService
from apps.appointments.services.notification import AppointmentNotificationService
from core.permissions import IsStaff, IsClient
from .serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentUpdateSerializer,
    AppointmentMinimalSerializer,
    PublicAppointmentRequestSerializer,
    AvailableSlotSerializer
)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Appointment CRUD operations (staff only).

    Permissions:
    - Staff (boss/employe): Full CRUD access to all appointments

    Endpoints:
    - GET /api/appointments/ - List all appointments
    - POST /api/appointments/ - Create new appointment
    - GET /api/appointments/{id}/ - Retrieve appointment details
    - PATCH /api/appointments/{id}/ - Update appointment
    - DELETE /api/appointments/{id}/ - Delete appointment
    - POST /api/appointments/{id}/sync-google/ - Sync with Google Calendar
    - POST /api/appointments/bulk-sync/ - Sync all appointments
    - GET /api/appointments/stats/ - Get appointment statistics
    """

    queryset = Appointment.objects.all().select_related(
        'client', 'case', 'created_by'
    )
    permission_classes = [IsAuthenticated, IsStaff]
    filterset_fields = ['appointment_type', 'status', 'client', 'case']
    search_fields = ['title', 'description', 'requested_by_name', 'requested_by_email']
    ordering_fields = ['starts_at', 'created_at', 'status']
    ordering = ['starts_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AppointmentUpdateSerializer
        elif self.action == 'list':
            return AppointmentMinimalSerializer
        return AppointmentSerializer

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()

        # Search filter
        search_query = self.request.query_params.get('q', None)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(requested_by_name__icontains=search_query) |
                Q(requested_by_email__icontains=search_query)
            )

        # Date range filter
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if start_date:
            queryset = queryset.filter(starts_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(starts_at__lte=end_date)

        # Status filter (support multiple)
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            statuses = status_filter.split(',')
            queryset = queryset.filter(status__in=statuses)

        # Only public requests
        public_only = self.request.query_params.get('public_only', None)
        if public_only and public_only.lower() == 'true':
            queryset = queryset.filter(client=None, requested_by_email__isnull=False)

        return queryset

    def perform_create(self, serializer):
        """Set created_by to current user when creating appointment."""
        appointment = serializer.save(created_by=self.request.user)

        # Try to sync with Google Calendar
        if appointment.status in ['pending', 'confirmed']:
            google_service = GoogleCalendarService()
            result = google_service.create_event(appointment)

            if result['success']:
                appointment.google_calendar_id = result['event_id']
                appointment.google_meet_link = result.get('google_meet_link')
                appointment.last_sync_at = timezone.now()
                appointment.save(update_fields=['google_calendar_id', 'google_meet_link', 'last_sync_at'])

    def perform_update(self, serializer):
        """Update appointment and sync with Google Calendar if needed."""
        appointment = serializer.save()

        # Sync with Google Calendar if it exists
        if appointment.google_calendar_id:
            google_service = GoogleCalendarService()
            result = google_service.update_event(appointment)

            if result['success']:
                appointment.last_sync_at = timezone.now()
                appointment.save(update_fields=['last_sync_at'])

    def perform_destroy(self, instance):
        """Delete appointment and remove from Google Calendar."""
        if instance.google_calendar_id:
            google_service = GoogleCalendarService()
            google_service.delete_event(instance.google_calendar_id)

        super().perform_destroy(instance)

    @action(detail=True, methods=['post'])
    def sync_google(self, request, pk=None):
        """
        Sync appointment with Google Calendar.

        POST /api/appointments/{id}/sync-google/
        """
        appointment = self.get_object()
        google_service = GoogleCalendarService()

        if not google_service.is_enabled():
            return Response(
                {'detail': 'Google Calendar integration is not enabled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create or update in Google Calendar
        if appointment.google_calendar_id:
            result = google_service.update_event(appointment)
        else:
            result = google_service.create_event(appointment)

        if result['success']:
            appointment.google_calendar_id = result.get('event_id', appointment.google_calendar_id)
            appointment.google_meet_link = result.get('google_meet_link', appointment.google_meet_link)
            appointment.last_sync_at = timezone.now()
            appointment.save(update_fields=['google_calendar_id', 'google_meet_link', 'last_sync_at'])

            return Response({
                'success': True,
                'message': 'Appointment synced successfully with Google Calendar.',
                'google_calendar_id': appointment.google_calendar_id,
                'google_meet_link': appointment.google_meet_link
            })
        else:
            return Response(
                {'detail': result.get('error', 'Failed to sync with Google Calendar')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def bulk_sync(self, request):
        """
        Bulk sync all appointments with Google Calendar.

        POST /api/appointments/bulk-sync/
        """
        google_service = GoogleCalendarService()

        if not google_service.is_enabled():
            return Response(
                {'detail': 'Google Calendar integration is not enabled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get appointments to sync (future appointments, not cancelled)
        appointments = Appointment.objects.filter(
            starts_at__gte=timezone.now(),
            status__in=['pending', 'confirmed']
        )

        synced_count = 0
        errors = []

        for appointment in appointments:
            if appointment.google_calendar_id:
                result = google_service.update_event(appointment)
            else:
                result = google_service.create_event(appointment)

            if result['success']:
                appointment.google_calendar_id = result.get('event_id', appointment.google_calendar_id)
                appointment.last_sync_at = timezone.now()
                appointment.save(update_fields=['google_calendar_id', 'last_sync_at'])
                synced_count += 1
            else:
                errors.append({
                    'appointment_id': appointment.id,
                    'error': result.get('error')
                })

        return Response({
            'success': True,
            'synced_count': synced_count,
            'total': appointments.count(),
            'errors': errors
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get appointment statistics.

        GET /api/appointments/stats/
        """
        total_appointments = Appointment.objects.count()

        # Count by status
        status_counts = Appointment.objects.values('status').annotate(count=Count('id'))
        status_dict = {item['status']: item['count'] for item in status_counts}

        # Count by type
        type_counts = Appointment.objects.values('appointment_type').annotate(count=Count('id'))
        type_dict = {item['appointment_type']: item['count'] for item in type_counts}

        # Public requests vs client appointments
        public_requests = Appointment.objects.filter(client=None, requested_by_email__isnull=False).count()

        # Upcoming appointments
        upcoming = Appointment.objects.filter(
            starts_at__gte=timezone.now(),
            status__in=['pending', 'confirmed']
        ).order_by('starts_at')[:5]

        return Response({
            'total_appointments': total_appointments,
            'public_requests': public_requests,
            'status_breakdown': status_dict,
            'type_breakdown': type_dict,
            'upcoming_appointments': AppointmentMinimalSerializer(upcoming, many=True).data
        })

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        Confirm a pending appointment and notify client.

        POST /api/appointments/{id}/confirm/

        Changes status to 'confirmed' and sends confirmation email to client.
        """
        appointment = self.get_object()

        if appointment.status == 'confirmed':
            return Response(
                {'detail': 'La cita ya está confirmada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status
        old_status = appointment.status
        appointment.status = 'confirmed'
        appointment.save(update_fields=['status'])

        # Send confirmation email to client
        email_sent = AppointmentNotificationService.send_confirmation_to_client(appointment)

        # Generate WhatsApp link
        whatsapp_link = AppointmentNotificationService.generate_whatsapp_link(appointment, confirmed=True)

        # Try to sync with Google Calendar if not already synced
        if not appointment.google_calendar_id:
            google_service = GoogleCalendarService()
            result = google_service.create_event(appointment)

            if result['success']:
                appointment.google_calendar_id = result.get('event_id')
                appointment.google_meet_link = result.get('google_meet_link')
                appointment.last_sync_at = timezone.now()
                appointment.save(update_fields=['google_calendar_id', 'google_meet_link', 'last_sync_at'])

        return Response({
            'success': True,
            'message': 'Cita confirmada exitosamente.',
            'appointment': AppointmentSerializer(appointment).data,
            'email_sent': email_sent,
            'whatsapp_link': whatsapp_link
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment.

        POST /api/appointments/{id}/cancel/
        """
        appointment = self.get_object()

        if appointment.status == 'cancelled':
            return Response(
                {'detail': 'La cita ya está cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status
        appointment.status = 'cancelled'
        appointment.save(update_fields=['status'])

        # Remove from Google Calendar if exists
        if appointment.google_calendar_id:
            google_service = GoogleCalendarService()
            google_service.delete_event(appointment.google_calendar_id)

        # TODO: Send cancellation notification to client
        # AppointmentNotificationService.notify_cancellation(appointment)

        return Response({
            'success': True,
            'message': 'Cita cancelada exitosamente.',
            'appointment': AppointmentSerializer(appointment).data
        })

    @action(detail=True, methods=['get'])
    def whatsapp_link(self, request, pk=None):
        """
        Get WhatsApp link for appointment notification.

        GET /api/appointments/{id}/whatsapp_link/

        Returns a wa.me link with pre-filled message.
        """
        appointment = self.get_object()

        # Check if appointment has phone number
        if not appointment.requested_by_phone and (not appointment.client or not appointment.client.phone):
            return Response(
                {'detail': 'No hay número de teléfono disponible para esta cita.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate WhatsApp link
        confirmed = appointment.status == 'confirmed'
        whatsapp_link = AppointmentNotificationService.generate_whatsapp_link(appointment, confirmed)

        if not whatsapp_link:
            return Response(
                {'detail': 'No se pudo generar el enlace de WhatsApp.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'success': True,
            'whatsapp_link': whatsapp_link,
            'message': AppointmentNotificationService.generate_whatsapp_message(appointment, confirmed)
        })


class PublicAvailabilityView(views.APIView):
    """
    Public endpoint for checking available appointment slots.

    GET /api/public/appointments/available-slots/?date=2024-12-16&duration=60

    Returns list of available time slots for the specified date.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        # Get query parameters
        date_str = request.query_params.get('date')
        duration = request.query_params.get('duration', 60)

        if not date_str:
            return Response(
                {'detail': 'Parameter "date" is required (format: YYYY-MM-DD)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse date
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'detail': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse duration
        try:
            duration = int(duration)
        except ValueError:
            return Response(
                {'detail': 'Invalid duration. Must be an integer (minutes)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get available slots
        availability_service = AvailabilityService()
        slots = availability_service.get_available_slots(target_date, duration)

        # Add duration to each slot
        for slot in slots:
            slot['duration_minutes'] = duration

        serializer = AvailableSlotSerializer(slots, many=True)

        return Response({
            'date': date_str,
            'duration_minutes': duration,
            'total_slots': len(slots),
            'available_slots': len([s for s in slots if s['available']]),
            'slots': serializer.data
        })


class PublicAppointmentRequestView(views.APIView):
    """
    Public endpoint for requesting appointments.

    POST /api/public/appointments/request/

    Allows anyone to request an appointment without authentication.
    Creates appointment with status='pending' for staff review.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicAppointmentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create appointment
        appointment = Appointment.objects.create(
            requested_by_name=serializer.validated_data['requested_by_name'],
            requested_by_email=serializer.validated_data['requested_by_email'],
            requested_by_phone=serializer.validated_data['requested_by_phone'],
            starts_at=serializer.validated_data['starts_at'],
            ends_at=serializer.validated_data['ends_at'],
            appointment_type=serializer.validated_data['appointment_type'],
            title=f"Solicitud de cita - {serializer.validated_data['requested_by_name']}",
            description=serializer.validated_data.get('message', ''),
            status='pending'
        )

        # Send notification to staff about new appointment request
        staff_notified = AppointmentNotificationService.notify_staff_new_request(appointment)

        return Response({
            'success': True,
            'message': 'Tu solicitud de cita ha sido enviada. Recibirás confirmación por correo electrónico.',
            'appointment_id': appointment.id,
            'appointment': AppointmentMinimalSerializer(appointment).data
        }, status=status.HTTP_201_CREATED)


class AppointmentPortalViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Portal viewset for clients to view their appointments.

    Permissions:
    - Client role only
    - Can only view appointments where they are the client

    Endpoints:
    - GET /api/portal/appointments/ - List own appointments
    - GET /api/portal/appointments/{id}/ - View appointment details
    """

    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated, IsClient]

    def get_queryset(self):
        """Return only appointments where authenticated user is the client."""
        user = self.request.user

        # Get the client profile linked to this user
        if hasattr(user, 'client_profile'):
            client = user.client_profile
            return Appointment.objects.filter(
                client=client
            ).select_related('case', 'created_by').order_by('-starts_at')

        return Appointment.objects.none()
