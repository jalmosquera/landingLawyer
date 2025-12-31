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
    def create_access_tokens_for_case(case, client, requested_by):
        """
        Create access tokens for ALL sensitive documents in a case.

        All documents will share the same 6-digit access code.

        Args:
            case: Case instance
            client: User instance (with role='client')
            requested_by: User instance (staff who initiated notification)

        Returns:
            tuple: (access_code, list of DocumentAccessToken instances)
        """
        from apps.documents.models import Document
        import secrets

        # Get all sensitive documents in this case that haven't been notified
        documents = Document.objects.filter(
            case=case,
            is_sensitive=True,
            notification_sent=False
        )

        if not documents.exists():
            return None, []

        # Generate ONE access code for all documents
        access_code = f"{secrets.randbelow(900000) + 100000}"
        expires_at = timezone.now() + timedelta(hours=24)

        # Invalidate previous unused tokens for these documents
        DocumentAccessToken.objects.filter(
            document__in=documents,
            client=client,
            token_type='access',
            used=False
        ).update(used=True, used_at=timezone.now())

        # Create tokens for all documents with the SAME access code
        tokens = []
        for document in documents:
            token = DocumentAccessToken(
                document=document,
                requested_by=requested_by,
                client=client,
                token_type='access',
                access_code=access_code,
                expires_at=expires_at
            )
            token.save()
            tokens.append(token)

        return access_code, tokens

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

    @staticmethod
    def send_email_notification_multi(tokens, reference_token):
        """
        Send email notification for MULTIPLE documents.

        Args:
            tokens: List of DocumentAccessToken instances (all with same access_code)
            reference_token: First token for reference data

        Returns:
            bool: True if email sent successfully
        """
        document = reference_token.document
        access_token = reference_token
        case = document.case
        client = case.client

        # Build list of documents
        documents_list = [token.document for token in tokens]

        try:
            subject = f'Nuevos documentos disponibles - Caso {case.case_number}'

            html_content = render_to_string('emails/document_notification.html', {
                'client_name': client.full_name or client.user.username,
                'case_number': case.case_number,
                'case_title': case.title,
                'documents': documents_list,  # List of documents
                'documents_count': len(documents_list),
                'access_code': access_token.access_code,
                'expires_at': access_token.expires_at,
                'verification_url': f"{settings.FRONTEND_URL}/documents/verify",
                'frontend_url': settings.FRONTEND_URL,
            })

            email = EmailMultiAlternatives(
                subject=subject,
                body=f'Código de acceso: {access_token.access_code}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[client.email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()

            return True

        except Exception as e:
            print(f"Error sending email: {e}")
            return False

    @staticmethod
    def generate_whatsapp_link_multi(tokens, reference_token):
        """
        Generate WhatsApp link for MULTIPLE documents.

        Args:
            tokens: List of DocumentAccessToken instances
            reference_token: First token for reference data

        Returns:
            str: WhatsApp wa.me link
        """
        from urllib.parse import quote

        document = reference_token.document
        access_token = reference_token
        case = document.case
        client = case.client

        # Get client phone number
        phone = client.phone
        if phone and not phone.startswith('52'):
            # Assume Mexican number, add country code
            phone = phone.replace('+', '').replace(' ', '').replace('-', '')
            if len(phone) == 10:
                phone = f'52{phone}'

        # Prepare message with document count
        documents_count = len(tokens)
        message = f"""Hola {client.full_name}, tienes {documents_count} nuevo{'s' if documents_count > 1 else ''} documento{'s' if documents_count > 1 else ''} disponible{'s' if documents_count > 1 else ''} para el caso {case.case_number}.

📄 {documents_count} documento{'s' if documents_count > 1 else ''}

🔑 Código de acceso: {access_token.access_code}

🔗 Ingresa en: {settings.FRONTEND_URL}/documents/verify

⏰ Válido hasta: {access_token.expires_at.strftime('%d/%m/%Y %H:%M')}"""

        # URL encode message
        encoded_message = quote(message)

        # Generate WhatsApp link
        if phone:
            return f"https://wa.me/{phone}?text={encoded_message}"
        else:
            return f"https://wa.me/?text={encoded_message}"

    @classmethod
    def notify_client(cls, document, requested_by):
        """
        Complete notification flow: create tokens for ALL sensitive documents in case.

        When notifying ONE document, we notify ALL pending sensitive documents
        from the same case with a single shared access code.

        Args:
            document: Document instance (triggers notification for whole case)
            requested_by: User instance (staff)

        Returns:
            dict: {
                'success': bool,
                'access_code': str,
                'email_sent': bool,
                'whatsapp_link': str,
                'expires_at': datetime,
                'documents_count': int
            }
        """
        # Get client and case
        case = document.case
        client = case.client.user

        if not client or client.role != 'client':
            return {
                'success': False,
                'error': 'El cliente no tiene cuenta de usuario o no tiene rol de cliente.'
            }

        # Create access tokens for ALL sensitive documents in the case
        access_code, tokens = cls.create_access_tokens_for_case(case, client, requested_by)

        if not tokens:
            return {
                'success': False,
                'error': 'No hay documentos sensibles pendientes de notificación en este caso.'
            }

        # Get first token for reference (all share same code and expiry)
        first_token = tokens[0]

        # Mark ALL documents as notified
        from apps.documents.models import Document
        Document.objects.filter(
            id__in=[token.document.id for token in tokens]
        ).update(notification_sent=True)

        # Send email with list of ALL documents
        email_sent = cls.send_email_notification_multi(tokens, first_token)

        # Generate WhatsApp link with document count
        whatsapp_link = cls.generate_whatsapp_link_multi(tokens, first_token)

        return {
            'success': True,
            'access_code': access_code,
            'email_sent': email_sent,
            'whatsapp_link': whatsapp_link,
            'expires_at': first_token.expires_at,
            'documents_count': len(tokens)
        }
