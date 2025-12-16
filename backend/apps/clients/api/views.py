"""
Client API views.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from apps.clients.models import Client
from core.permissions import IsStaff, IsClient
from .serializers import (
    ClientSerializer,
    ClientCreateSerializer,
    ClientUpdateSerializer,
    ClientMinimalSerializer
)


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Client CRUD operations.

    Permissions:
    - Staff (boss/employe): Full CRUD access to all clients
    - Clients: Read-only access to their own profile via /api/portal/me/client/

    Endpoints:
    - GET /api/clients/ - List all clients (staff only)
    - POST /api/clients/ - Create new client (staff only)
    - GET /api/clients/{id}/ - Retrieve client details (staff only)
    - PATCH /api/clients/{id}/ - Update client (staff only)
    - DELETE /api/clients/{id}/ - Delete client (staff only)
    - GET /api/clients/search/?q=query - Search clients by name, email, phone
    """

    queryset = Client.objects.all().select_related('user', 'created_by')
    permission_classes = [IsAuthenticated, IsStaff]
    filterset_fields = ['identification_type', 'created_by']
    search_fields = ['full_name', 'email', 'phone', 'identification_number']
    ordering_fields = ['created_at', 'full_name', 'email']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ClientCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ClientUpdateSerializer
        elif self.action == 'list':
            # Use minimal serializer for list to reduce payload
            return ClientMinimalSerializer
        return ClientSerializer

    def get_queryset(self):
        """
        Filter queryset based on user role.

        Staff: See all clients
        Clients: See only their own profile (handled in custom action)
        """
        queryset = super().get_queryset()

        # Apply search filter if provided
        search_query = self.request.query_params.get('q', None)
        if search_query:
            queryset = queryset.filter(
                Q(full_name__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(phone__icontains=search_query) |
                Q(identification_number__icontains=search_query)
            )

        # Filter by portal access status
        has_portal = self.request.query_params.get('has_portal_access', None)
        if has_portal is not None:
            if has_portal.lower() == 'true':
                queryset = queryset.exclude(user=None)
            elif has_portal.lower() == 'false':
                queryset = queryset.filter(user=None)

        return queryset

    def perform_create(self, serializer):
        """Set created_by to current user when creating client."""
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """
        Soft-delete validation: prevent deletion if client has active cases.
        """
        instance = self.get_object()

        # Check for active cases
        active_cases = instance.cases.filter(status__in=['open', 'in_progress']).count()
        if active_cases > 0:
            return Response(
                {
                    'detail': f'No se puede eliminar el cliente. Tiene {active_cases} caso(s) activo(s). '
                              f'Cierre o archive los casos primero.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def cases(self, request, pk=None):
        """
        Get all cases for a specific client.

        GET /api/clients/{id}/cases/
        """
        client = self.get_object()
        from apps.cases.api.serializers import CaseMinimalSerializer

        cases = client.cases.all().order_by('-created_at')
        serializer = CaseMinimalSerializer(cases, many=True)

        return Response({
            'client': {
                'id': client.id,
                'full_name': client.full_name,
                'email': client.email
            },
            'cases': serializer.data,
            'total_cases': cases.count(),
            'active_cases': cases.filter(status__in=['open', 'in_progress']).count()
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get client statistics.

        GET /api/clients/stats/
        """
        total_clients = Client.objects.count()
        clients_with_portal = Client.objects.exclude(user=None).count()
        clients_without_portal = total_clients - clients_with_portal

        # Clients with active cases
        clients_with_active_cases = Client.objects.filter(
            cases__status__in=['open', 'in_progress']
        ).distinct().count()

        return Response({
            'total_clients': total_clients,
            'clients_with_portal': clients_with_portal,
            'clients_without_portal': clients_without_portal,
            'clients_with_active_cases': clients_with_active_cases,
            'recent_clients': Client.objects.order_by('-created_at')[:5].values(
                'id', 'full_name', 'email', 'created_at'
            )
        })


class ClientPortalViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Portal viewset for clients to access their own profile.

    Permissions:
    - Client role only
    - Can only view their own data

    Endpoints:
    - GET /api/portal/me/client/ - Get own client profile
    """

    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, IsClient]

    def get_queryset(self):
        """Return only the client profile of the authenticated user."""
        return Client.objects.filter(user=self.request.user).select_related('user', 'created_by')

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get authenticated client's profile.

        GET /api/portal/me/client/
        """
        try:
            client = self.get_queryset().first()
            if not client:
                return Response(
                    {'detail': 'No se encontró un perfil de cliente para este usuario.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = self.get_serializer(client)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {'detail': f'Error al obtener el perfil: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
