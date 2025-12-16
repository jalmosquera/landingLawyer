"""
Document notification service for email and WhatsApp.

Handles sending access codes to clients via email and generating WhatsApp links.
"""

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
from urllib.parse import quote

from apps.documents.models import Document, DocumentAccessToken, DocumentAccessLog


class DocumentNotificationService:
    """Service for handling document notifications."""

    @staticmethod
    def create_access_token(document, client, requested_by):
        """
        Create a new access token for document download.

        Invalidates any previous unused tokens for the same document/client pair.

        Args:
            document: Document instance
            client: User instance (with role='client')
            requested_by: User instance (staff who initiated notification)

        Returns:
            DocumentAccessToken instance with generated 6-digit code
        """
        # Invalidate previous unused tokens
        DocumentAccessToken.objects.filter(
            document=document,
            client=client,
            token_type='access',
            used=False
        ).update(used=True, used_at=timezone.now())

        # Create new token
        token = DocumentAccessToken.objects.create(
            document=document,
            requested_by=requested_by,
            client=client,
            token_type='access'
        )

        return token

    @staticmethod
    def send_email_notification(document, access_token):
        """
        Send email notification with access code to client.

        Args:
            document: Document instance
            access_token: DocumentAccessToken instance

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            client = access_token.client
            case = document.case

            # Prepare context for email template
            context = {
                'client_name': client.name,
                'document_title': document.title,
                'document_type': document.get_document_type_display(),
                'case_number': case.case_number,
                'case_title': case.title,
                'access_code': access_token.access_code,
                'expires_at': access_token.expires_at,
                'verification_url': f"{settings.FRONTEND_URL}/documents/verify",
                'frontend_url': settings.FRONTEND_URL,
            }

            # Render HTML and plain text versions
            html_content = render_to_string('emails/document_notification.html', context)
            text_content = strip_tags(html_content)

            # Create email
            subject = f'Nuevo documento disponible - {case.case_number}'
            from_email = settings.DEFAULT_FROM_EMAIL
            to_email = client.email

            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[to_email]
            )
            email.attach_alternative(html_content, "text/html")

            # Send email
            email.send()

            # Log success
            DocumentAccessLog.objects.create(
                document=document,
                user=client,
                event_type='notification_sent',
                success=True,
                details=f'Email enviado a {to_email} con código {access_token.access_code}'
            )

            # Update document notification status
            document.notification_sent = True
            document.notification_sent_at = timezone.now()
            document.save(update_fields=['notification_sent', 'notification_sent_at'])

            return True

        except Exception as e:
            # Log failure
            DocumentAccessLog.objects.create(
                document=document,
                user=client,
                event_type='notification_sent',
                success=False,
                details=f'Error al enviar email: {str(e)}'
            )
            return False

    @staticmethod
    def generate_whatsapp_link(document, access_token):
        """
        Generate WhatsApp Web link with pre-filled message.

        Args:
            document: Document instance
            access_token: DocumentAccessToken instance

        Returns:
            str: WhatsApp link URL
        """
        client = access_token.client
        case = document.case

        # Get client phone from their profile
        try:
            client_profile = client.client_profile
            phone = client_profile.phone
        except:
            # Fallback if no profile
            phone = None

        # Clean phone number (remove spaces, dashes, etc.)
        if phone:
            phone = ''.join(filter(str.isdigit, phone))
            # Add country code if missing (assume Mexico +52)
            if not phone.startswith('52'):
                phone = f'52{phone}'

        # Prepare message
        message = f"""Hola {client.name}, tienes un nuevo documento disponible para el caso {case.case_number}.

📄 Documento: {document.title}

Código de acceso: {access_token.access_code}

Ingresa en: {settings.FRONTEND_URL}/documents/verify

Válido hasta: {access_token.expires_at.strftime('%d/%m/%Y %H:%M')}"""

        # URL encode message
        encoded_message = quote(message)

        # Generate WhatsApp link
        if phone:
            # wa.me link with phone number
            return f"https://wa.me/{phone}?text={encoded_message}"
        else:
            # wa.me link without phone (user selects contact)
            return f"https://wa.me/?text={encoded_message}"

    @classmethod
    def notify_client(cls, document, requested_by):
        """
        Complete notification flow: create token, send email, return WhatsApp link.

        Args:
            document: Document instance
            requested_by: User instance (staff)

        Returns:
            dict: {
                'success': bool,
                'access_code': str,
                'email_sent': bool,
                'whatsapp_link': str,
                'expires_at': datetime
            }
        """
        # Get client from case
        client = document.case.client.user

        if not client or client.role != 'client':
            return {
                'success': False,
                'error': 'El cliente no tiene cuenta de usuario o no tiene rol de cliente.'
            }

        # Create access token
        access_token = cls.create_access_token(document, client, requested_by)

        # Send email
        email_sent = cls.send_email_notification(document, access_token)

        # Generate WhatsApp link
        whatsapp_link = cls.generate_whatsapp_link(document, access_token)

        return {
            'success': True,
            'access_code': access_token.access_code,
            'email_sent': email_sent,
            'whatsapp_link': whatsapp_link,
            'expires_at': access_token.expires_at
        }
