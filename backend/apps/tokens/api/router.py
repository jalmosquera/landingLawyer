from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AccessTokenViewSet, validate_token

router = DefaultRouter()
router.register(r'tokens', AccessTokenViewSet, basename='token')

urlpatterns = [
    path('', include(router.urls)),
    path('validate/<uuid:token_string>/', validate_token, name='validate-token'),
]
