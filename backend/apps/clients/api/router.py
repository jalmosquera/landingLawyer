from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ClientViewSet, ClientNoteViewSet

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'client-notes', ClientNoteViewSet, basename='client-note')

urlpatterns = [
    path('', include(router.urls)),
]
