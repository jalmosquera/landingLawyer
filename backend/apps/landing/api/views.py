"""
Landing API views.
"""

from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Q

from apps.landing.models import Service, Testimonial, SuccessCase, ContactRequest
from core.permissions import IsStaff
from .serializers import (
    ServiceSerializer,
    TestimonialSerializer,
    SuccessCaseSerializer,
    ContactRequestSerializer,
    PublicContactRequestSerializer,
    ContactRequestUpdateSerializer
)


class PublicServiceView(views.APIView):
    """
    Public endpoint for listing active services.

    GET /api/public/services/

    Returns all active services ordered by 'order' field.
    No authentication required.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        services = Service.objects.filter(is_active=True).order_by('order', 'title')
        serializer = ServiceSerializer(services, many=True)

        return Response({
            'services': serializer.data,
            'total': services.count()
        })


class PublicTestimonialView(views.APIView):
    """
    Public endpoint for listing active testimonials.

    GET /api/public/testimonials/

    Returns all active testimonials ordered by 'order' field.
    No authentication required.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        # Optional: limit number of testimonials
        limit = request.query_params.get('limit', None)

        testimonials = Testimonial.objects.filter(is_active=True).order_by('order', '-date')

        if limit:
            try:
                testimonials = testimonials[:int(limit)]
            except ValueError:
                pass

        serializer = TestimonialSerializer(testimonials, many=True)

        return Response({
            'testimonials': serializer.data,
            'total': testimonials.count()
        })


class PublicSuccessCaseView(views.APIView):
    """
    Public endpoint for listing active success cases.

    GET /api/public/success-cases/

    Returns all active success cases ordered by 'order' field.
    No authentication required.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        # Optional: filter by case_type
        case_type = request.query_params.get('case_type', None)
        limit = request.query_params.get('limit', None)

        success_cases = SuccessCase.objects.filter(is_active=True).order_by('order', '-date')

        if case_type:
            success_cases = success_cases.filter(case_type__icontains=case_type)

        if limit:
            try:
                success_cases = success_cases[:int(limit)]
            except ValueError:
                pass

        serializer = SuccessCaseSerializer(success_cases, many=True)

        return Response({
            'success_cases': serializer.data,
            'total': success_cases.count()
        })


class PublicContactRequestView(views.APIView):
    """
    Public endpoint for submitting contact requests.

    POST /api/public/contact-requests/

    Allows visitors to submit contact form without authentication.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicContactRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        contact_request = serializer.save()

        return Response({
            'success': True,
            'message': 'Tu solicitud ha sido enviada. Nos pondremos en contacto contigo pronto.',
            'request_id': contact_request.id
        }, status=status.HTTP_201_CREATED)


# Staff ViewSets (authentication required)


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Service CRUD operations (staff only).

    Endpoints:
    - GET /api/landing/services/ - List all services
    - POST /api/landing/services/ - Create new service
    - GET /api/landing/services/{id}/ - Retrieve service details
    - PATCH /api/landing/services/{id}/ - Update service
    - DELETE /api/landing/services/{id}/ - Delete service
    """

    queryset = Service.objects.all().order_by('order', 'title')
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated, IsStaff]
    filterset_fields = ['is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['order', 'title']


class TestimonialViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Testimonial CRUD operations (staff only).

    Endpoints:
    - GET /api/landing/testimonials/ - List all testimonials
    - POST /api/landing/testimonials/ - Create new testimonial
    - GET /api/landing/testimonials/{id}/ - Retrieve testimonial details
    - PATCH /api/landing/testimonials/{id}/ - Update testimonial
    - DELETE /api/landing/testimonials/{id}/ - Delete testimonial
    """

    queryset = Testimonial.objects.all().order_by('order', '-date')
    serializer_class = TestimonialSerializer
    permission_classes = [IsAuthenticated, IsStaff]
    filterset_fields = ['is_active', 'rating']
    search_fields = ['client_name', 'text']
    ordering_fields = ['order', 'date', 'rating']


class SuccessCaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SuccessCase CRUD operations (staff only).

    Endpoints:
    - GET /api/landing/success-cases/ - List all success cases
    - POST /api/landing/success-cases/ - Create new success case
    - GET /api/landing/success-cases/{id}/ - Retrieve success case details
    - PATCH /api/landing/success-cases/{id}/ - Update success case
    - DELETE /api/landing/success-cases/{id}/ - Delete success case
    """

    queryset = SuccessCase.objects.all().order_by('order', '-date')
    serializer_class = SuccessCaseSerializer
    permission_classes = [IsAuthenticated, IsStaff]
    filterset_fields = ['is_active', 'case_type']
    search_fields = ['title', 'description', 'result', 'case_type']
    ordering_fields = ['order', 'date', 'case_type']


class ContactRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ContactRequest management (staff only).

    Endpoints:
    - GET /api/landing/contact-requests/ - List all contact requests
    - GET /api/landing/contact-requests/{id}/ - Retrieve request details
    - PATCH /api/landing/contact-requests/{id}/ - Update request (status, assign, notes)
    - DELETE /api/landing/contact-requests/{id}/ - Delete request
    - GET /api/landing/contact-requests/stats/ - Get statistics
    """

    queryset = ContactRequest.objects.all().select_related('assigned_to').order_by('-created_at')
    permission_classes = [IsAuthenticated, IsStaff]
    filterset_fields = ['status', 'request_type', 'assigned_to']
    search_fields = ['name', 'email', 'subject', 'message']
    ordering_fields = ['created_at', 'status']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ['update', 'partial_update']:
            return ContactRequestUpdateSerializer
        return ContactRequestSerializer

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()

        # Filter new/unassigned requests
        new_only = self.request.query_params.get('new_only', None)
        if new_only and new_only.lower() == 'true':
            queryset = queryset.filter(status='new')

        unassigned_only = self.request.query_params.get('unassigned_only', None)
        if unassigned_only and unassigned_only.lower() == 'true':
            queryset = queryset.filter(assigned_to=None)

        return queryset

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assign contact request to a staff member.

        POST /api/landing/contact-requests/{id}/assign/
        Body: { "assigned_to": user_id }
        """
        contact_request = self.get_object()
        user_id = request.data.get('assigned_to')

        if not user_id:
            return Response(
                {'detail': 'El campo "assigned_to" es requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id, role__in=['boss', 'employe'])
        except User.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado o no tiene permisos de staff.'},
                status=status.HTTP_404_NOT_FOUND
            )

        contact_request.assigned_to = user
        if contact_request.status == 'new':
            contact_request.status = 'in_progress'
        contact_request.save()

        serializer = self.get_serializer(contact_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_contacted(self, request, pk=None):
        """
        Mark contact request as contacted.

        POST /api/landing/contact-requests/{id}/mark_contacted/
        """
        contact_request = self.get_object()
        contact_request.status = 'contacted'
        contact_request.save()

        return Response({
            'success': True,
            'message': 'Solicitud marcada como contactada.',
            'status': contact_request.status
        })

    @action(detail=True, methods=['post'])
    def mark_converted(self, request, pk=None):
        """
        Mark contact request as converted to client.

        POST /api/landing/contact-requests/{id}/mark_converted/
        """
        contact_request = self.get_object()
        contact_request.status = 'converted'
        contact_request.save()

        return Response({
            'success': True,
            'message': 'Solicitud marcada como convertida a cliente.',
            'status': contact_request.status
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get contact request statistics.

        GET /api/landing/contact-requests/stats/
        """
        total_requests = ContactRequest.objects.count()

        # Count by status
        status_counts = ContactRequest.objects.values('status').annotate(count=Count('id'))
        status_dict = {item['status']: item['count'] for item in status_counts}

        # Count by request type
        type_counts = ContactRequest.objects.values('request_type').annotate(count=Count('id'))
        type_dict = {item['request_type']: item['count'] for item in type_counts}

        # New/unassigned requests
        new_requests = ContactRequest.objects.filter(status='new').count()
        unassigned_requests = ContactRequest.objects.filter(assigned_to=None).count()

        # Recent requests
        recent_requests = ContactRequest.objects.order_by('-created_at')[:5]

        return Response({
            'total_requests': total_requests,
            'new_requests': new_requests,
            'unassigned_requests': unassigned_requests,
            'status_breakdown': status_dict,
            'type_breakdown': type_dict,
            'recent_requests': ContactRequestSerializer(recent_requests, many=True).data
        })
