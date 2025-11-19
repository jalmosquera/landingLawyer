from rest_framework import serializers
from apps.appointments.models import Appointment, AppointmentNotification


class AppointmentNotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for appointment notifications.
    """

    class Meta:
        model = AppointmentNotification
        fields = ['id', 'type', 'channel', 'status', 'sent_at', 'error_message', 'created_at']
        read_only_fields = ['id', 'sent_at', 'created_at']


class AppointmentListSerializer(serializers.ModelSerializer):
    """
    Serializer for appointment list (minimal fields).
    """
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    lawyer_name = serializers.CharField(source='lawyer.get_full_name', read_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'title', 'client_name', 'lawyer_name', 'start_time', 'end_time', 'status', 'meet_link']
        read_only_fields = ['id']


class AppointmentDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for appointment details.
    """
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    lawyer_name = serializers.CharField(source='lawyer.get_full_name', read_only=True)
    notifications = AppointmentNotificationSerializer(many=True, read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'title', 'description', 'client', 'client_name',
            'lawyer', 'lawyer_name', 'start_time', 'end_time',
            'google_event_id', 'meet_link', 'status',
            'cancelled_at', 'cancellation_reason', 'notifications',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'google_event_id', 'meet_link', 'created_at', 'updated_at']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating appointments.
    """

    class Meta:
        model = Appointment
        fields = ['title', 'description', 'client', 'start_time', 'end_time']

    def validate(self, attrs):
        if attrs['end_time'] <= attrs['start_time']:
            raise serializers.ValidationError("End time must be after start time.")
        return attrs

    def create(self, validated_data):
        # Set the lawyer from the request context
        validated_data['lawyer'] = self.context['request'].user

        # TODO: Integrate with Google Calendar service
        # google_service = GoogleCalendarService(credentials=...)
        # result = google_service.create_event(...)
        # validated_data['google_event_id'] = result['event_id']
        # validated_data['meet_link'] = result['meet_link']

        return super().create(validated_data)
