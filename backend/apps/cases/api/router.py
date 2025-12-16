"""
Case API router configuration.
"""

from rest_framework.routers import DefaultRouter
from .views import CaseViewSet, CasePortalViewSet

# Create router instance
router = DefaultRouter()

# Register viewsets
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'portal/cases', CasePortalViewSet, basename='case-portal')

# Export urlpatterns
urlpatterns = router.urls
