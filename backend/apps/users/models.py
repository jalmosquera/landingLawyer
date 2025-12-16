"""
User models for authentication and authorization.

Includes:
- Custom User model with role-based access (boss, employe, client)
- PasswordResetToken model for password reset functionality
"""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
import secrets
from datetime import timedelta


class UserManager(BaseUserManager):
    """
    Custom user manager for creating users and superusers.
    """
    def create_user(self, username, email, name, password=None, **extra_fields):
        """
        Create and save a regular user with the given username, email, name and password.
        """
        if not username:
            raise ValueError('Users must have a username')
        if not email:
            raise ValueError('Users must have an email address')
        if not name:
            raise ValueError('Users must have a name')

        email = self.normalize_email(email)
        user = self.model(
            username=username,
            email=email,
            name=name,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, name, password=None, **extra_fields):
        """
        Create and save a superuser with the given username, email, name and password.
        Superuser defaults to 'boss' role.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'boss')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, name, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.

    Roles:
    - boss: Full administrative access (the lawyer/owner)
    - employe: Staff member with partial access
    - client: Limited portal access to own data

    Additional fields for contact information and profile.
    """
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('boss', 'Boss'),
        ('employe', 'Employe'),
    ]

    # Override first_name and last_name to use a single name field
    first_name = None
    last_name = None

    # Core fields
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    image = models.ImageField(upload_to='users/avatars/', null=True, blank=True)

    # Role and permissions
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')

    # Contact information
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=250, blank=True)
    location = models.CharField(max_length=100, blank=True)
    province = models.CharField(max_length=100, blank=True)

    objects = UserManager()

    # Required fields for createsuperuser command
    REQUIRED_FIELDS = ['email', 'name']

    class Meta:
        db_table = 'users_users'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return f"{self.name} ({self.username})"

    @property
    def is_boss(self):
        """Check if user is a boss."""
        return self.role == 'boss'

    @property
    def is_employe(self):
        """Check if user is an employe."""
        return self.role == 'employe'

    @property
    def is_client(self):
        """Check if user is a client."""
        return self.role == 'client'

    @property
    def is_staff_member(self):
        """Check if user is staff (boss or employe)."""
        return self.role in ['boss', 'employe']


class PasswordResetToken(models.Model):
    """
    Token model for password reset functionality.

    Generates unique tokens that expire after 1 hour and can only be used once.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'used']),
        ]

    def __str__(self):
        return f"Password reset token for {self.user.username}"

    def save(self, *args, **kwargs):
        """
        Override save to auto-generate token and expiry time.
        Token expires in 1 hour from creation.
        """
        if not self.pk:
            # Generate a secure random token
            self.token = secrets.token_urlsafe(32)
            # Set expiry to 1 hour from now
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)

    def is_valid(self):
        """
        Check if the token is still valid.
        A token is valid if it hasn't been used and hasn't expired.
        """
        return not self.used and timezone.now() < self.expires_at
