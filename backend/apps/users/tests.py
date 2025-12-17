"""
Tests for Users app.
"""

from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from apps.users.models import User, PasswordResetToken
from datetime import timedelta
from django.utils import timezone


class UserModelTests(TestCase):
    """
    Test cases for User model.
    """

    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            name='Test User',
            password='testpass123'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@test.com')
        self.assertEqual(user.name, 'Test User')
        self.assertEqual(user.role, 'client')
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password('testpass123'))

    def test_create_superuser(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(
            username='boss',
            email='boss@test.com',
            name='Boss User',
            password='bosspass123'
        )
        self.assertEqual(user.username, 'boss')
        self.assertEqual(user.role, 'boss')
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_user_str(self):
        """Test user string representation."""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            name='Test User',
            password='testpass123'
        )
        self.assertEqual(str(user), 'Test User (testuser)')

    def test_user_role_properties(self):
        """Test user role property methods."""
        client_user = User.objects.create_user(
            username='client',
            email='client@test.com',
            name='Client User',
            password='pass123',
            role='client'
        )
        self.assertTrue(client_user.is_client)
        self.assertFalse(client_user.is_boss)
        self.assertFalse(client_user.is_employe)
        self.assertFalse(client_user.is_staff_member)

        boss_user = User.objects.create_user(
            username='boss',
            email='boss@test.com',
            name='Boss User',
            password='pass123',
            role='boss',
            is_staff=True
        )
        self.assertTrue(boss_user.is_boss)
        self.assertTrue(boss_user.is_staff_member)
        self.assertFalse(boss_user.is_client)


class PasswordResetTokenModelTests(TestCase):
    """
    Test cases for PasswordResetToken model.
    """

    def setUp(self):
        """Set up test user."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            name='Test User',
            password='testpass123'
        )

    def test_token_creation(self):
        """Test token is created with correct attributes."""
        token = PasswordResetToken.objects.create(user=self.user)
        self.assertIsNotNone(token.token)
        self.assertFalse(token.used)
        self.assertIsNotNone(token.expires_at)

    def test_token_is_valid(self):
        """Test token validity check."""
        token = PasswordResetToken.objects.create(user=self.user)
        self.assertTrue(token.is_valid())

        # Mark as used
        token.used = True
        token.save()
        self.assertFalse(token.is_valid())

    def test_token_expiry(self):
        """Test token expiry."""
        token = PasswordResetToken.objects.create(user=self.user)
        # Manually set expiry to past
        token.expires_at = timezone.now() - timedelta(hours=2)
        token.save()
        self.assertFalse(token.is_valid())


class AuthAPITests(APITestCase):
    """
    Test cases for authentication API endpoints.
    """

    def setUp(self):
        """Set up test users."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            name='Test User',
            password='testpass123'
        )
        self.staff_user = User.objects.create_user(
            username='staff',
            email='staff@test.com',
            name='Staff User',
            password='staffpass123',
            role='employe',
            is_staff=True
        )

    def test_login_success(self):
        """Test successful login."""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_authenticated(self):
        """Test /me endpoint with authenticated user."""
        # Get token
        login_response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        token = login_response.data['access']

        # Get profile
        response = self.client.get(
            '/api/auth/me/',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@test.com')

    def test_me_endpoint_unauthenticated(self):
        """Test /me endpoint without authentication."""
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_password_reset_request(self):
        """Test password reset request."""
        response = self.client.post('/api/auth/password-reset/', {
            'email': 'test@test.com'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check token was created
        self.assertTrue(
            PasswordResetToken.objects.filter(user=self.user).exists()
        )


class UserViewSetTests(APITestCase):
    """
    Test cases for User ViewSet (staff only).
    """

    def setUp(self):
        """Set up test users."""
        self.client_user = User.objects.create_user(
            username='client',
            email='client@test.com',
            name='Client User',
            password='pass123',
            role='client'
        )
        self.staff_user = User.objects.create_user(
            username='staff',
            email='staff@test.com',
            name='Staff User',
            password='pass123',
            role='employe',
            is_staff=True
        )

    def get_token(self, username, password):
        """Helper to get JWT token."""
        response = self.client.post('/api/auth/login/', {
            'username': username,
            'password': password
        })
        return response.data['access']

    def test_list_users_as_staff(self):
        """Test staff can list users."""
        token = self.get_token('staff', 'pass123')
        response = self.client.get(
            '/api/auth/users/',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_users_as_client(self):
        """Test client cannot list users."""
        token = self.get_token('client', 'pass123')
        response = self.client.get(
            '/api/auth/users/',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
