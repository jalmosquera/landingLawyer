"""
Appointment API router configuration.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    AppointmentViewSet,
    AppointmentPortalViewSet,
    PublicAvailabilityView,
    PublicAvailableDatesView,
    PublicAppointmentRequestView,
    LawyerAvailabilityViewSet
)

# Create router instance
router = DefaultRouter()

# Register viewsets
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'portal/appointments', AppointmentPortalViewSet, basename='appointment-portal')
router.register(r'lawyer-availability', LawyerAvailabilityViewSet, basename='lawyer-availability')

# Custom URL patterns for public endpoints
urlpatterns = router.urls + [
    # Public endpoints (no authentication required)
    path(
        'public/appointments/available-slots/',
        PublicAvailabilityView.as_view(),
        name='appointment-available-slots'
    ),
    path(
        'public/appointments/available-dates/',
        PublicAvailableDatesView.as_view(),
        name='appointment-available-dates'
    ),
    path(
        'public/appointments/request/',
        PublicAppointmentRequestView.as_view(),
        name='appointment-public-request'
    ),
]
