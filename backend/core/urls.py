"""
URL configuration for landingLawyer project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import root
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/',SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('', root,name = 'root'),     
    # API Endpoints
    path('api/auth/', include('apps.users.api.router')),
    path('api/', include('apps.clients.api.router')),
    path('api/', include('apps.cases.api.router')),
    path('api/', include('apps.documents.api.router')),
    path('api/', include('apps.appointments.api.router')),
    path('api/', include('apps.landing.api.router')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
