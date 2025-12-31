"""
Document API views.
"""

from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
from django.utils import timezone
from django.db.models import Q

from apps.documents.models import Document, DocumentAccessToken, DocumentAccessLog
from apps.documents.services.notification import DocumentNotificationService
from core.permissions import IsStaff, IsClient
from .serializers import (
    DocumentSerializer,
    DocumentUploadSerializer,
    DocumentMinimalSerializer,
    DocumentAccessTokenSerializer,
    DocumentAccessLogSerializer,
    ValidateCodeSerializer,
    DownloadTokenResponseSerializer,
    NotifyClientSerializer
)


def get_client_ip(request):
    """Extract client IP from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Document CRUD operations (staff only).

    Permissions:
    - Staff (boss/employe): Full CRUD access to all documents

    Endpoints:
    - GET /api/documents/ - List all documents (staff only)
    - POST /api/documents/ - Upload new document (staff only, multipart/form-data)
    - GET /api/documents/{id}/ - Retrieve document details (staff only)
    - PATCH /api/documents/{id}/ - Update document metadata (staff only)
    - DELETE /api/documents/{id}/ - Delete document (staff only)
    - POST /api/documents/{id}/notify-client/ - Send notification to client
    - GET /api/documents/{id}/access-logs/ - View access audit trail
    """

    queryset = Document.objects.all().select_related(
        'case', 'case__client', 'uploaded_by'
    )
    permission_classes = [IsAuthenticated, IsStaff]
    parser_classes = [MultiPartParser, FormParser]
    filterset_fields = ['case', 'document_type', 'is_sensitive', 'uploaded_by_client', 'notification_sent']
    search_fields = ['title', 'description', 'original_filename', 'case__case_number']
    ordering_fields = ['uploaded_at', 'title', 'file_size']
    ordering = ['-uploaded_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return DocumentUploadSerializer
        elif self.action == 'list':
            return DocumentMinimalSerializer
        elif self.action == 'notify_client':
            return NotifyClientSerializer
        elif self.action == 'access_logs':
            return DocumentAccessLogSerializer
        return DocumentSerializer

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()

        # Search filter
        search_query = self.request.query_params.get('q', None)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(original_filename__icontains=search_query) |
                Q(case__case_number__icontains=search_query)
            )

        # Filter by case
        case_id = self.request.query_params.get('case', None)
        if case_id:
            queryset = queryset.filter(case_id=case_id)

        return queryset

    def perform_create(self, serializer):
        """Set uploaded_by to current user when creating document."""
        document = serializer.save(uploaded_by=self.request.user)

        # Log upload event
        DocumentAccessLog.objects.create(
            document=document,
            user=self.request.user,
            event_type='upload',
            success=True,
            details=f'Documento subido: {document.title}',
            ip_address=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )

    @action(detail=True, methods=['post'])
    def notify_client(self, request, pk=None):
        """
        Send notification to client with access code.

        POST /api/documents/{id}/notify-client/

        Returns:
            {
                'success': true,
                'access_code': '123456',
                'email_sent': true,
                'whatsapp_link': 'https://wa.me/...',
                'expires_at': '2024-12-17T10:00:00Z'
            }
        """
        document = self.get_object()

        # Validate that case has a client with user account
        if not document.case.client.user:
            return Response(
                {'detail': 'El cliente no tiene cuenta de usuario. Créela primero en la sección de clientes.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use notification service
        result = DocumentNotificationService.notify_client(
            document=document,
            requested_by=request.user
        )

        if not result.get('success'):
            return Response(
                {'detail': result.get('error', 'Error al enviar notificación')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            'success': True,
            'access_code': result['access_code'],
            'email_sent': result['email_sent'],
            'whatsapp_link': result['whatsapp_link'],
            'expires_at': result['expires_at'],
            'message': 'Notificación enviada exitosamente. Se ha enviado un email al cliente y se generó el enlace de WhatsApp.'
        })

    @action(detail=True, methods=['get'])
    def access_logs(self, request, pk=None):
        """
        Get access logs for a specific document.

        GET /api/documents/{id}/access-logs/
        """
        document = self.get_object()
        logs = document.access_logs.all().order_by('-timestamp')

        serializer = DocumentAccessLogSerializer(logs, many=True)

        return Response({
            'document': {
                'id': document.id,
                'title': document.title
            },
            'logs': serializer.data,
            'total_logs': logs.count()
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get document statistics.

        GET /api/documents/stats/
        """
        total_documents = Document.objects.count()
        sensitive_documents = Document.objects.filter(is_sensitive=True).count()
        notified_documents = Document.objects.filter(notification_sent=True).count()
        client_uploaded = Document.objects.filter(uploaded_by_client=True).count()

        return Response({
            'total_documents': total_documents,
            'sensitive_documents': sensitive_documents,
            'notified_documents': notified_documents,
            'client_uploaded': client_uploaded,
            'staff_uploaded': total_documents - client_uploaded,
            'pending_notification': sensitive_documents - notified_documents,
        })


class ValidateCodeView(views.APIView):
    """
    Public endpoint for validating 6-digit access codes.

    POST /api/public/documents/validate-code/

    Request:
        {
            "access_code": "123456",
            "email": "client@example.com"
        }

    Response:
        {
            "download_token": "...",
            "document_id": 1,
            "document_title": "...",
            "expires_at": "...",
            "download_url": "/api/public/documents/download/{token}/"
        }
    """

    permission_classes = [AllowAny]
    throttle_scope = 'validate_code'  # Rate limit to prevent brute force

    def post(self, request):
        serializer = ValidateCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        access_code = serializer.validated_data['access_code']
        email = serializer.validated_data['email']

        # Find ALL access tokens with this code (multiple documents can share same code)
        access_tokens = DocumentAccessToken.objects.select_related(
            'document', 'client'
        ).filter(
            access_code=access_code,
            token_type='access',
            used=False
        )

        if not access_tokens.exists():
            # Log failed attempt
            DocumentAccessLog.objects.create(
                document=None,
                user=None,
                event_type='access_denied',
                success=False,
                details=f'Código inválido: {access_code}',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )

            return Response(
                {'detail': 'Código de acceso inválido o ya utilizado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Use first token for validation (all share same code/expiry/client)
        first_token = access_tokens.first()

        # Increment attempts on first token
        first_token.attempts += 1
        first_token.save(update_fields=['attempts'])

        # Check if expired
        if not first_token.is_valid():
            DocumentAccessLog.objects.create(
                document=first_token.document,
                user=first_token.client,
                event_type='token_expired',
                success=False,
                details=f'Token expirado: {access_code}',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )

            return Response(
                {'detail': 'El código de acceso ha expirado. Solicite uno nuevo.'},
                status=status.HTTP_410_GONE
            )

        # Verify email matches client
        if first_token.client.email.lower() != email.lower():
            DocumentAccessLog.objects.create(
                document=first_token.document,
                user=None,
                event_type='access_denied',
                success=False,
                details=f'Email no coincide para código: {access_code}',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )

            return Response(
                {'detail': 'El email no coincide con el destinatario del código.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Mark ALL access tokens as used and create download tokens for ALL documents
        documents_data = []

        for access_token in access_tokens:
            # Mark as used
            access_token.mark_as_used(
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )

            # Create download token
            download_token = DocumentAccessToken.objects.create(
                document=access_token.document,
                requested_by=access_token.requested_by,
                client=access_token.client,
                token_type='download'
            )

            # Log successful validation
            DocumentAccessLog.objects.create(
                document=access_token.document,
                user=access_token.client,
                event_type='code_validated',
                success=True,
                details=f'Código validado exitosamente: {access_code}',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )

            # Build download URL
            download_url = request.build_absolute_uri(
                f'/api/public/documents/download/{download_token.download_token}/'
            )

            # Add document data
            documents_data.append({
                'download_token': download_token.download_token,
                'document_id': access_token.document.id,
                'document_title': access_token.document.title,
                'original_filename': access_token.document.original_filename,
                'expires_at': download_token.expires_at,
                'download_url': download_url
            })

        # Return list of documents
        return Response({
            'documents': documents_data,
            'total': len(documents_data)
        }, status=status.HTTP_200_OK)


class DownloadDocumentView(views.APIView):
    """
    Public endpoint for downloading documents with token.

    GET /api/public/documents/download/{token}/

    Returns file stream if token is valid.
    """

    permission_classes = [AllowAny]

    def get(self, request, token):
        # Find valid download token
        try:
            download_token = DocumentAccessToken.objects.select_related(
                'document', 'client'
            ).get(
                download_token=token,
                token_type='download',
                used=False
            )
        except DocumentAccessToken.DoesNotExist:
            return Response(
                {'detail': 'Token de descarga inválido o ya utilizado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if expired
        if not download_token.is_valid():
            DocumentAccessLog.objects.create(
                document=download_token.document,
                user=download_token.client,
                event_type='token_expired',
                success=False,
                details=f'Token de descarga expirado',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )

            return Response(
                {'detail': 'El token de descarga ha expirado. Valide su código nuevamente.'},
                status=status.HTTP_410_GONE
            )

        # Mark token as used
        download_token.mark_as_used(
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )

        # Log download
        DocumentAccessLog.objects.create(
            document=download_token.document,
            user=download_token.client,
            event_type='download',
            success=True,
            details=f'Documento descargado exitosamente',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )

        # Return file
        document = download_token.document
        try:
            response = FileResponse(
                document.file.open('rb'),
                as_attachment=True,
                filename=document.original_filename
            )
            return response
        except Exception as e:
            DocumentAccessLog.objects.create(
                document=document,
                user=download_token.client,
                event_type='download',
                success=False,
                details=f'Error al descargar archivo: {str(e)}',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )

            return Response(
                {'detail': 'Error al descargar el archivo.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentPortalViewSet(viewsets.ModelViewSet):
    """
    Portal viewset for clients to manage their documents.

    Permissions:
    - Client role only
    - Can only view documents from their own cases
    - Can upload documents to their own cases

    Endpoints:
    - GET /api/portal/documents/ - List own documents
    - GET /api/portal/documents/{id}/ - View document details
    - POST /api/portal/documents/ - Upload document to own case
    """

    permission_classes = [IsAuthenticated, IsClient]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        """Return only documents from cases where authenticated user is the client."""
        user = self.request.user

        # Get the client profile linked to this user
        if hasattr(user, 'client_profile'):
            client = user.client_profile
            return Document.objects.filter(
                case__client=client
            ).select_related('case', 'uploaded_by').order_by('-uploaded_at')

        return Document.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return DocumentUploadSerializer
        return DocumentSerializer

    def create(self, request, *args, **kwargs):
        """Upload document to client's case."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verify case belongs to this client
        case_id = serializer.validated_data.get('case').id
        if hasattr(request.user, 'client_profile'):
            client = request.user.client_profile
            if not client.cases.filter(id=case_id).exists():
                return Response(
                    {'detail': 'No puedes subir documentos a casos que no te pertenecen.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def perform_create(self, serializer):
        """Set uploaded_by to current user and mark as client upload."""
        document = serializer.save(
            uploaded_by=self.request.user,
            uploaded_by_client=True
        )

        # Log upload event
        DocumentAccessLog.objects.create(
            document=document,
            user=self.request.user,
            event_type='upload',
            success=True,
            details=f'Documento subido por cliente: {document.title}',
            ip_address=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
