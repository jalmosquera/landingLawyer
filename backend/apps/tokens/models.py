import uuid
from django.db import models
from django.utils import timezone


class AccessToken(models.Model):
    """
    Access token for secure report downloads.
    """
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    report = models.ForeignKey('reports.LegalReport', on_delete=models.CASCADE, related_name='access_tokens')
    client = models.ForeignKey('clients.Client', on_delete=models.CASCADE, related_name='access_tokens')
    expires_at = models.DateTimeField(help_text='Token expiration date/time')
    max_uses = models.IntegerField(default=1, help_text='Maximum number of times this token can be used')
    current_uses = models.IntegerField(default=0, help_text='Current number of times this token has been used')
    is_revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'access_tokens'
        verbose_name = 'Access Token'
        verbose_name_plural = 'Access Tokens'
        ordering = ['-created_at']

    def __str__(self):
        return f"Token for {self.report.title} - {self.client.full_name}"

    def is_valid(self):
        """Check if token is valid (not expired, not revoked, not exceeded uses)."""
        if self.is_revoked:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        if self.current_uses >= self.max_uses:
            return False
        return True

    def increment_use(self):
        """Increment the usage counter."""
        self.current_uses += 1
        self.save(update_fields=['current_uses'])

    def revoke(self):
        """Revoke this token."""
        self.is_revoked = True
        self.revoked_at = timezone.now()
        self.save(update_fields=['is_revoked', 'revoked_at'])


class TokenAccess(models.Model):
    """
    Log of token access attempts.
    """
    token = models.ForeignKey(AccessToken, on_delete=models.CASCADE, related_name='access_logs')
    accessed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    download_completed = models.BooleanField(default=False)

    class Meta:
        db_table = 'token_accesses'
        verbose_name = 'Token Access'
        verbose_name_plural = 'Token Accesses'
        ordering = ['-accessed_at']

    def __str__(self):
        return f"Access to {self.token.token} from {self.ip_address}"
