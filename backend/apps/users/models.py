from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    Used for lawyer/admin authentication.
    """

    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('lawyer', 'Lawyer'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='lawyer')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
