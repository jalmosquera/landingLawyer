from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend

from apps.reports.models import LegalReport
from apps.users.permissions import IsLawyer
from .serializers import (
    LegalReportListSerializer,
    LegalReportDetailSerializer,
    LegalReportCreateSerializer
)


class LegalReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing legal reports.
    """
    permission_classes = [IsAuthenticated, IsLawyer]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'client', 'created_by']
    ordering = ['-created_at']

    def get_queryset(self):
        # Lawyers can only see reports for their clients
        if self.request.user.role == 'lawyer':
            return LegalReport.objects.filter(client__lawyer=self.request.user)
        # Admins can see all reports
        return LegalReport.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return LegalReportListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return LegalReportCreateSerializer
        return LegalReportDetailSerializer

    @action(detail=True, methods=['post'])
    def generate_token(self, request, pk=None):
        """
        Generate an access token for this report.
        """
        report = self.get_object()

        # Import here to avoid circular dependency
        from apps.tokens.services import TokenService

        expires_in_hours = request.data.get('expires_in_hours', 24)
        max_uses = request.data.get('max_uses', 1)

        token = TokenService.generate_token(
            report=report,
            expires_in_hours=expires_in_hours,
            max_uses=max_uses
        )

        return Response({
            'token': str(token.token),
            'expires_at': token.expires_at,
            'max_uses': token.max_uses
        })
