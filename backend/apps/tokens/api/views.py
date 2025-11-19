from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from apps.tokens.models import AccessToken
from apps.tokens.services import TokenService
from apps.reports.models import LegalReport
from apps.reports.services import S3ReportService
from apps.users.permissions import IsLawyer
from .serializers import AccessTokenSerializer, TokenGenerateSerializer, TokenValidateSerializer


class AccessTokenViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing access tokens (private endpoints).
    """
    serializer_class = AccessTokenSerializer
    permission_classes = [IsAuthenticated, IsLawyer]

    def get_queryset(self):
        # Lawyers can only see tokens for their clients' reports
        if self.request.user.role == 'lawyer':
            return AccessToken.objects.filter(report__client__lawyer=self.request.user)
        # Admins can see all tokens
        return AccessToken.objects.all()

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate a new access token for a report.
        """
        serializer = TokenGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report = get_object_or_404(LegalReport, id=serializer.validated_data['report_id'])

        # Check permissions
        if request.user.role == 'lawyer' and report.client.lawyer != request.user:
            return Response(
                {'detail': 'You do not have permission to create tokens for this report.'},
                status=status.HTTP_403_FORBIDDEN
            )

        token = TokenService.generate_token(
            report=report,
            expires_in_hours=serializer.validated_data.get('expires_in_hours', 24),
            max_uses=serializer.validated_data.get('max_uses', 1)
        )

        return Response(AccessTokenSerializer(token).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """
        Revoke an access token.
        """
        token = self.get_object()
        token.revoke()
        return Response({'detail': 'Token revoked successfully'})

    @action(detail=True, methods=['get'])
    def tracking(self, request, pk=None):
        """
        Get access tracking history for a token.
        """
        token = self.get_object()
        serializer = AccessTokenSerializer(token)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def validate_token(request, token_string):
    """
    Public endpoint to validate a token and get download URL.
    """
    # Get client IP
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(',')[0]
    else:
        ip_address = request.META.get('REMOTE_ADDR')

    user_agent = request.META.get('HTTP_USER_AGENT', '')

    # Validate token
    token, error = TokenService.validate_token(token_string)

    if error:
        # Log failed access attempt
        return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)

    # Log successful access
    TokenService.log_access(token, ip_address, user_agent, download_completed=False)

    # Increment usage counter
    token.increment_use()

    # Generate download URL
    download_url = S3ReportService.generate_presigned_url(token.report.pdf_file.name)

    response_data = {
        'token': str(token.token),
        'report_title': token.report.title,
        'download_url': download_url,
        'expires_at': token.expires_at,
        'remaining_uses': token.max_uses - token.current_uses
    }

    return Response(response_data)
