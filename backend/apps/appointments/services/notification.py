"""
Appointment notification service.

Handles email notifications for appointments:
- Confirmation emails to clients
- New appointment alerts to staff
- Reminder notifications (future enhancement)
"""

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
import urllib.parse

User = get_user_model()


class AppointmentNotificationService:
    """Service for handling appointment email notifications."""

    @classmethod
    def send_confirmation_to_client(cls, appointment):
        """
        Send confirmation email to client when appointment is confirmed.

        Args:
            appointment: Appointment instance

        Returns:
            bool: True if email was sent successfully
        """
        try:
            # Get client email
            if appointment.client and appointment.client.user:
                client_email = appointment.client.user.email
                client_name = appointment.client.full_name
            else:
                client_email = appointment.requested_by_email
                client_name = appointment.requested_by_name

            if not client_email:
                return False

            # Calculate duration in minutes
            duration = int((appointment.ends_at - appointment.starts_at).total_seconds() / 60)

            # Get case number if exists
            case_number = appointment.case.case_number if appointment.case else None

            # Render email template
            html_message = render_to_string('emails/appointment_confirmation.html', {
                'client_name': client_name,
                'requested_by_name': appointment.requested_by_name,
                'title': appointment.title,
                'description': appointment.description,
                'starts_at': appointment.starts_at,
                'ends_at': appointment.ends_at,
                'duration': duration,
                'appointment_type': appointment.appointment_type,
                'location': appointment.location,
                'google_meet_link': appointment.google_meet_link,
                'status': appointment.status,
                'case_number': case_number,
                'firm_name': getattr(settings, 'FIRM_NAME', 'Bufete Legal'),
                'contact_email': getattr(settings, 'DEFAULT_FROM_EMAIL', 'contacto@bufete.com'),
            })

            # Send email
            subject = f"Confirmación de Cita - {appointment.title}"
            from_email = settings.DEFAULT_FROM_EMAIL

            send_mail(
                subject=subject,
                message='',  # Plain text version (empty, using HTML)
                from_email=from_email,
                recipient_list=[client_email],
                html_message=html_message,
                fail_silently=False,
            )

            return True

        except Exception as e:
            print(f"Error sending confirmation email: {str(e)}")
            return False

    @classmethod
    def notify_staff_new_request(cls, appointment):
        """
        Notify staff members when a new appointment request is created.

        Args:
            appointment: Appointment instance

        Returns:
            bool: True if at least one email was sent successfully
        """
        try:
            # Get all staff users (boss and employe roles)
            staff_users = User.objects.filter(role__in=['boss', 'employe'], is_active=True)

            if not staff_users.exists():
                return False

            # Calculate duration in minutes
            duration = int((appointment.ends_at - appointment.starts_at).total_seconds() / 60)

            # Get dashboard URL
            dashboard_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')

            # Render email template
            html_message = render_to_string('emails/new_appointment_staff.html', {
                'appointment_id': appointment.id,
                'requested_by_name': appointment.requested_by_name,
                'requested_by_email': appointment.requested_by_email,
                'requested_by_phone': appointment.requested_by_phone,
                'title': appointment.title,
                'description': appointment.description,
                'starts_at': appointment.starts_at,
                'duration': duration,
                'appointment_type': appointment.appointment_type,
                'created_at': appointment.created_at,
                'dashboard_url': dashboard_url,
                'firm_name': getattr(settings, 'FIRM_NAME', 'Bufete Legal'),
            })

            # Send email to all staff members
            subject = f"🔔 Nueva Solicitud de Cita - {appointment.requested_by_name}"
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient_list = [user.email for user in staff_users if user.email]

            if not recipient_list:
                return False

            send_mail(
                subject=subject,
                message='',
                from_email=from_email,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False,
            )

            return True

        except Exception as e:
            print(f"Error sending staff notification: {str(e)}")
            return False

    @classmethod
    def generate_whatsapp_message(cls, appointment, confirmed=False):
        """
        Generate WhatsApp message text for appointment.

        Args:
            appointment: Appointment instance
            confirmed: Whether appointment is confirmed

        Returns:
            str: Pre-filled WhatsApp message
        """
        # Get client name
        if appointment.client and appointment.client.user:
            client_name = appointment.client.full_name
        else:
            client_name = appointment.requested_by_name

        # Format datetime
        formatted_date = appointment.starts_at.strftime("%d/%m/%Y")
        formatted_time = appointment.starts_at.strftime("%H:%M")

        # Get appointment type in Spanish
        type_map = {
            'in_person': 'Presencial',
            'phone': 'Telefónica',
            'video': 'Videollamada'
        }
        appointment_type_es = type_map.get(appointment.appointment_type, appointment.appointment_type)

        if confirmed:
            message = f"""Hola {client_name},

Tu cita ha sido confirmada ✓

📅 Fecha: {formatted_date}
🕐 Hora: {formatted_time}
📋 Asunto: {appointment.title}
📍 Tipo: {appointment_type_es}
"""
            if appointment.location and appointment.appointment_type == 'in_person':
                message += f"\n📌 Ubicación: {appointment.location}"

            if appointment.google_meet_link and appointment.appointment_type == 'video':
                message += f"\n🔗 Enlace: {appointment.google_meet_link}"

            message += "\n\nNos vemos pronto."
        else:
            message = f"""Hola {client_name},

Hemos recibido tu solicitud de cita.

📅 Fecha solicitada: {formatted_date}
🕐 Hora: {formatted_time}
📋 Asunto: {appointment.title}

Te confirmaremos pronto por email.

Gracias."""

        return message

    @classmethod
    def generate_whatsapp_link(cls, appointment, confirmed=False):
        """
        Generate WhatsApp link with pre-filled message.

        Args:
            appointment: Appointment instance
            confirmed: Whether appointment is confirmed

        Returns:
            str: WhatsApp wa.me link
        """
        # Get phone number
        if appointment.client and appointment.client.user:
            phone = appointment.client.phone
        else:
            phone = appointment.requested_by_phone

        if not phone:
            return None

        # Clean phone number (remove spaces, dashes, parentheses)
        phone_clean = ''.join(filter(str.isdigit, phone))

        # Add country code if not present (default Mexico +52)
        if not phone_clean.startswith('52') and len(phone_clean) == 10:
            phone_clean = '52' + phone_clean

        # Generate message
        message = cls.generate_whatsapp_message(appointment, confirmed)

        # URL encode message
        message_encoded = urllib.parse.quote(message)

        # Generate wa.me link
        whatsapp_link = f"https://wa.me/{phone_clean}?text={message_encoded}"

        return whatsapp_link

    @classmethod
    def send_reminder(cls, appointment, hours_before=24):
        """
        Send reminder email to client before appointment.

        Args:
            appointment: Appointment instance
            hours_before: How many hours before appointment to remind

        Returns:
            bool: True if email was sent successfully

        Note: This is a placeholder for future implementation.
        Can be called from a scheduled task (Celery/cron).
        """
        # TODO: Implement reminder logic
        # Check if appointment is within reminder window
        # Send reminder email using similar template
        pass

    @classmethod
    def notify_cancellation(cls, appointment):
        """
        Notify client when appointment is cancelled.

        Args:
            appointment: Appointment instance

        Returns:
            bool: True if email was sent successfully

        Note: This is a placeholder for future implementation.
        """
        # TODO: Implement cancellation notification
        pass
