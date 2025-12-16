"""
Case API views.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone

from apps.cases.models import Case
from core.permissions import IsStaff, IsClient
from .serializers import (
    CaseSerializer,
    CaseCreateSerializer,
    CaseUpdateSerializer,
    CaseMinimalSerializer,
    CaseTimelineSerializer
)


class CaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Case CRUD operations.

    Permissions:
    - Staff (boss/employe): Full CRUD access to all cases
    - Clients: Read-only access to their own cases via /api/portal/cases/

    Endpoints:
    - GET /api/cases/ - List all cases (staff only)
    - POST /api/cases/ - Create new case (staff only)
    - GET /api/cases/{id}/ - Retrieve case details (staff + assigned client)
    - PATCH /api/cases/{id}/ - Update case (staff only)
    - DELETE /api/cases/{id}/ - Delete case (staff only, with protection)
    - GET /api/cases/{id}/documents/ - List case documents
    - GET /api/cases/{id}/timeline/ - Get case timeline
    - GET /api/cases/stats/ - Get case statistics
    """

    queryset = Case.objects.all().select_related(
        'client', 'assigned_to', 'created_by', 'updated_by'
    )
    permission_classes = [IsAuthenticated, IsStaff]
    filterset_fields = ['case_type', 'status', 'priority', 'assigned_to', 'client']
    search_fields = ['case_number', 'title', 'description', 'client__full_name']
    ordering_fields = ['created_at', 'opened_at', 'closed_at', 'priority', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return CaseCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CaseUpdateSerializer
        elif self.action == 'list':
            return CaseMinimalSerializer
        elif self.action == 'timeline':
            return CaseTimelineSerializer
        return CaseSerializer

    def get_queryset(self):
        """
        Filter queryset based on user role and query parameters.

        Staff: See all cases
        Clients: Only their cases (handled in ClientPortalViewSet)
        """
        queryset = super().get_queryset()

        # Apply search filter
        search_query = self.request.query_params.get('q', None)
        if search_query:
            queryset = queryset.filter(
                Q(case_number__icontains=search_query) |
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(client__full_name__icontains=search_query)
            )

        # Filter by status (support multiple)
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            statuses = status_filter.split(',')
            queryset = queryset.filter(status__in=statuses)

        # Filter active cases only
        only_active = self.request.query_params.get('active', None)
        if only_active and only_active.lower() == 'true':
            queryset = queryset.filter(status__in=['open', 'in_progress'])

        return queryset

    def perform_create(self, serializer):
        """Set created_by to current user when creating case."""
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        """Set updated_by to current user when updating case."""
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """
        Soft-delete validation: prevent deletion if case has documents or is closed recently.
        """
        instance = self.get_object()

        # Prevent deletion if case has documents
        if instance.documents.exists():
            return Response(
                {
                    'detail': f'No se puede eliminar el caso. Tiene {instance.documents.count()} documento(s) asociado(s). '
                              f'Elimine los documentos primero o archive el caso.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Warn if trying to delete recently closed case
        if instance.status == 'closed' and instance.closed_at:
            days_since_closed = (timezone.now().date() - instance.closed_at).days
            if days_since_closed < 30:
                return Response(
                    {
                        'detail': f'El caso se cerró hace solo {days_since_closed} día(s). '
                                  f'Se recomienda archivar en lugar de eliminar.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """
        Get all documents for a specific case.

        GET /api/cases/{id}/documents/
        """
        case = self.get_object()
        from apps.documents.api.serializers import DocumentMinimalSerializer

        documents = case.documents.all().order_by('-uploaded_at')
        serializer = DocumentMinimalSerializer(documents, many=True)

        return Response({
            'case': {
                'id': case.id,
                'case_number': case.case_number,
                'title': case.title
            },
            'documents': serializer.data,
            'total_documents': documents.count()
        })

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """
        Get timeline of events for a case.

        GET /api/cases/{id}/timeline/

        Returns chronological list of:
        - Case creation and updates
        - Documents uploaded
        - Appointments scheduled
        - Status changes
        """
        case = self.get_object()
        events = []

        # Case created event
        events.append({
            'event_type': 'created',
            'timestamp': case.created_at,
            'description': f'Caso creado: {case.title}',
            'user': case.created_by.name if case.created_by else None,
            'details': {
                'status': case.status,
                'priority': case.priority,
                'assigned_to': case.assigned_to.name
            }
        })

        # Case updates (if updated_by exists, means it was modified)
        if case.updated_by and case.updated_at != case.created_at:
            events.append({
                'event_type': 'updated',
                'timestamp': case.updated_at,
                'description': 'Caso actualizado',
                'user': case.updated_by.name,
                'details': {}
            })

        # Documents uploaded
        for doc in case.documents.all().order_by('uploaded_at'):
            events.append({
                'event_type': 'document_uploaded',
                'timestamp': doc.uploaded_at,
                'description': f'Documento subido: {doc.title}',
                'user': doc.uploaded_by.name if doc.uploaded_by else None,
                'details': {
                    'document_type': doc.document_type,
                    'is_sensitive': doc.is_sensitive
                }
            })

        # Appointments scheduled
        appointments = case.appointments.all().order_by('created_at')
        for apt in appointments:
            events.append({
                'event_type': 'appointment_scheduled',
                'timestamp': apt.created_at,
                'description': f'Cita programada: {apt.title}',
                'user': apt.created_by.name if apt.created_by else None,
                'details': {
                    'starts_at': apt.starts_at,
                    'appointment_type': apt.appointment_type,
                    'status': apt.status
                }
            })

        # Case closed event
        if case.status == 'closed' and case.closed_at:
            events.append({
                'event_type': 'closed',
                'timestamp': timezone.datetime.combine(case.closed_at, timezone.datetime.min.time()).replace(tzinfo=timezone.get_current_timezone()),
                'description': 'Caso cerrado',
                'user': case.updated_by.name if case.updated_by else None,
                'details': {}
            })

        # Sort by timestamp descending
        events.sort(key=lambda x: x['timestamp'], reverse=True)

        serializer = CaseTimelineSerializer(events, many=True)
        return Response({
            'case': {
                'id': case.id,
                'case_number': case.case_number,
                'title': case.title
            },
            'timeline': serializer.data
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get case statistics.

        GET /api/cases/stats/
        """
        total_cases = Case.objects.count()

        # Count by status
        status_counts = Case.objects.values('status').annotate(count=Count('id'))
        status_dict = {item['status']: item['count'] for item in status_counts}

        # Count by priority
        priority_counts = Case.objects.values('priority').annotate(count=Count('id'))
        priority_dict = {item['priority']: item['count'] for item in priority_counts}

        # Count by case type
        type_counts = Case.objects.values('case_type').annotate(count=Count('id'))
        type_dict = {item['case_type']: item['count'] for item in type_counts}

        # Average days open for active cases
        active_cases = Case.objects.filter(status__in=['open', 'in_progress'])
        avg_days_open = 0
        if active_cases.exists():
            total_days = sum((timezone.now().date() - case.opened_at).days for case in active_cases)
            avg_days_open = total_days / active_cases.count()

        return Response({
            'total_cases': total_cases,
            'active_cases': status_dict.get('open', 0) + status_dict.get('in_progress', 0),
            'status_breakdown': status_dict,
            'priority_breakdown': priority_dict,
            'type_breakdown': type_dict,
            'avg_days_open': round(avg_days_open, 1),
            'recent_cases': Case.objects.order_by('-created_at')[:5].values(
                'id', 'case_number', 'title', 'status', 'created_at'
            )
        })


class CasePortalViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Portal viewset for clients to access their own cases.

    Permissions:
    - Client role only
    - Can only view cases where they are the client

    Endpoints:
    - GET /api/portal/cases/ - List own cases
    - GET /api/portal/cases/{id}/ - View case details
    """

    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated, IsClient]

    def get_queryset(self):
        """Return only cases where authenticated user is the client."""
        user = self.request.user

        # Get the client profile linked to this user
        if hasattr(user, 'client_profile'):
            client = user.client_profile
            return Case.objects.filter(client=client).select_related(
                'client', 'assigned_to', 'created_by', 'updated_by'
            ).order_by('-created_at')

        return Case.objects.none()

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """
        Get documents for a specific case (client view).

        GET /api/portal/cases/{id}/documents/
        """
        case = self.get_object()
        from apps.documents.api.serializers import DocumentMinimalSerializer

        # Clients see all documents except those marked as internal/staff-only
        documents = case.documents.all().order_by('-uploaded_at')
        serializer = DocumentMinimalSerializer(documents, many=True)

        return Response({
            'case': {
                'id': case.id,
                'case_number': case.case_number,
                'title': case.title
            },
            'documents': serializer.data,
            'total_documents': documents.count()
        })
