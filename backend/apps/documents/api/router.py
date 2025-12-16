"""
Document API router configuration.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    DocumentViewSet,
    DocumentPortalViewSet,
    ValidateCodeView,
    DownloadDocumentView
)

# Create router instance
router = DefaultRouter()

# Register viewsets
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'portal/documents', DocumentPortalViewSet, basename='document-portal')

# Custom URL patterns for public endpoints
urlpatterns = router.urls + [
    # Public endpoints (no authentication required)
    path(
        'public/documents/validate-code/',
        ValidateCodeView.as_view(),
        name='document-validate-code'
    ),
    path(
        'public/documents/download/<str:token>/',
        DownloadDocumentView.as_view(),
        name='document-download'
    ),
]
