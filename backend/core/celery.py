"""
Celery configuration for landingLawyer project.
"""

import os
from celery import Celery
from decouple import config

os.environ.setdefault(
    'DJANGO_SETTINGS_MODULE',
    f'core.settings.{config("DJANGO_ENV", default="development")}'
)

app = Celery('landingLawyer')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
