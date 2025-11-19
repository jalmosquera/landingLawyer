from django.db import models
from django.conf import settings


class Client(models.Model):
    """
    Client model for managing lawyer's clients.
    """
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    dni_curp = models.CharField(max_length=50, blank=True, null=True, verbose_name='DNI/CURP')
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=10, blank=True, null=True)
    lawyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='clients')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clients'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.email})"


class ClientNote(models.Model):
    """
    Notes about clients created by lawyers.
    """
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'client_notes'
        verbose_name = 'Client Note'
        verbose_name_plural = 'Client Notes'
        ordering = ['-created_at']

    def __str__(self):
        return f"Note for {self.client.full_name} - {self.created_at.strftime('%Y-%m-%d')}"


class CommunicationLog(models.Model):
    """
    Log of communications with clients.
    """
    TYPE_CHOICES = (
        ('email', 'Email'),
        ('phone', 'Phone'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('opened', 'Opened'),
        ('failed', 'Failed'),
    )

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='communications')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    subject = models.CharField(max_length=255, blank=True, null=True)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'communication_logs'
        verbose_name = 'Communication Log'
        verbose_name_plural = 'Communication Logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type.upper()} to {self.client.full_name} - {self.status}"
