from django.http import JsonResponse
from django.utils.timezone import now


def root(request):
    return JsonResponse({
        "service": "Eduardo Bernal Backend",
        "version": "1.0.0",
        "environment": "production",
        "status": "online",
        "timestamp": now().isoformat(),
    })
