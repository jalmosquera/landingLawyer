from django.core.cache import cache
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


class PublicAppointmentRequestThrottleTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def tearDown(self):
        cache.clear()

    def test_rejects_requests_after_the_configured_rate_limit(self):
        url = '/api/public/appointments/request/'

        for _ in range(5):
            response = self.client.post(url, {}, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post(url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
