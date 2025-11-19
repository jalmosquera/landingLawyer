from django.db import models
from django.conf import settings
import hashlib


class LegalReport(models.Model):
    """
    Legal report/document model with PDF file storage on S3.
    """
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('ready', 'Ready'),
        ('sent', 'Sent'),
    )

    client = models.ForeignKey('clients.Client', on_delete=models.CASCADE, related_name='reports')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    pdf_file = models.FileField(upload_to='reports/%Y/%m/', max_length=500)
    file_size = models.IntegerField(help_text='File size in bytes')
    file_hash = models.CharField(max_length=64, help_text='MD5 hash for file integrity')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'legal_reports'
        verbose_name = 'Legal Report'
        verbose_name_plural = 'Legal Reports'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.client.full_name}"

    def calculate_file_hash(self):
        """Calculate MD5 hash of the file."""
        md5_hash = hashlib.md5()
        for chunk in self.pdf_file.chunks():
            md5_hash.update(chunk)
        return md5_hash.hexdigest()
