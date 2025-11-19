from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from apps.appointments.models import Appointment
from apps.users.permissions import IsLawyer
from .serializers import (
    AppointmentListSerializer,
    AppointmentDetailSerializer,
    AppointmentCreateSerializer
)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing appointments.
    """
    permission_classes = [IsAuthenticated, IsLawyer]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'client', 'lawyer']
    ordering = ['start_time']

    def get_queryset(self):
        # Lawyers can only see their own appointments
        if self.request.user.role == 'lawyer':
            return Appointment.objects.filter(lawyer=self.request.user)
        # Admins can see all appointments
        return Appointment.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return AppointmentListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return AppointmentCreateSerializer
        return AppointmentDetailSerializer

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment.
        """
        appointment = self.get_object()
        cancellation_reason = request.data.get('reason', '')

        appointment.status = 'cancelled'
        appointment.cancelled_at = timezone.now()
        appointment.cancellation_reason = cancellation_reason
        appointment.save()

        # TODO: Delete from Google Calendar
        # TODO: Send cancellation notification

        return Response({'detail': 'Appointment cancelled successfully'})

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        Confirm an appointment.
        """
        appointment = self.get_object()
        appointment.status = 'confirmed'
        appointment.save()

        return Response({'detail': 'Appointment confirmed successfully'})
