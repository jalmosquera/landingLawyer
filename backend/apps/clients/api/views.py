from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.clients.models import Client, ClientNote
from apps.users.permissions import IsLawyer
from .serializers import (
    ClientListSerializer,
    ClientDetailSerializer,
    ClientCreateSerializer,
    ClientNoteSerializer
)


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing clients.
    """
    permission_classes = [IsAuthenticated, IsLawyer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'lawyer']
    search_fields = ['full_name', 'email', 'phone', 'dni_curp']
    ordering_fields = ['created_at', 'full_name']
    ordering = ['-created_at']

    def get_queryset(self):
        # Lawyers can only see their own clients
        if self.request.user.role == 'lawyer':
            return Client.objects.filter(lawyer=self.request.user)
        # Admins can see all clients
        return Client.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return ClientListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ClientCreateSerializer
        return ClientDetailSerializer


class ClientNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing client notes.
    """
    serializer_class = ClientNoteSerializer
    permission_classes = [IsAuthenticated, IsLawyer]

    def get_queryset(self):
        return ClientNote.objects.filter(client__lawyer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
