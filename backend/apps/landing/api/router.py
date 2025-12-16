"""
Landing API router configuration.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceViewSet,
    TestimonialViewSet,
    SuccessCaseViewSet,
    ContactRequestViewSet,
    PublicServiceView,
    PublicTestimonialView,
    PublicSuccessCaseView,
    PublicContactRequestView
)

# Create router instance
router = DefaultRouter()

# Register staff viewsets
router.register(r'landing/services', ServiceViewSet, basename='service')
router.register(r'landing/testimonials', TestimonialViewSet, basename='testimonial')
router.register(r'landing/success-cases', SuccessCaseViewSet, basename='success-case')
router.register(r'landing/contact-requests', ContactRequestViewSet, basename='contact-request')

# Custom URL patterns for public endpoints
urlpatterns = router.urls + [
    # Public endpoints (no authentication required)
    path(
        'public/services/',
        PublicServiceView.as_view(),
        name='public-services'
    ),
    path(
        'public/testimonials/',
        PublicTestimonialView.as_view(),
        name='public-testimonials'
    ),
    path(
        'public/success-cases/',
        PublicSuccessCaseView.as_view(),
        name='public-success-cases'
    ),
    path(
        'public/contact-requests/',
        PublicContactRequestView.as_view(),
        name='public-contact-request'
    ),
]
