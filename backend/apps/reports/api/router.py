from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import LegalReportViewSet

router = DefaultRouter()
router.register(r'reports', LegalReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
