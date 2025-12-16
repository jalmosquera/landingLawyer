"""
Client API router configuration.
"""

from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, ClientPortalViewSet

# Create router instance
router = DefaultRouter()

# Register viewsets
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'portal/clients', ClientPortalViewSet, basename='client-portal')

# Export urlpatterns
urlpatterns = router.urls
