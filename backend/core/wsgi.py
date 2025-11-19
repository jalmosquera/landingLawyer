"""
WSGI config for landingLawyer project.
"""

import os
from django.core.wsgi import get_wsgi_application
from decouple import config

os.environ.setdefault(
    'DJANGO_SETTINGS_MODULE',
    f'core.settings.{config("DJANGO_ENV", default="development")}'
)

application = get_wsgi_application()
