from datetime import timedelta
from django.utils import timezone
from .models import AccessToken, TokenAccess


class TokenService:
    """
    Service for generating and validating access tokens.
    """

    @staticmethod
    def generate_token(report, expires_in_hours=24, max_uses=1):
        """
        Generate a new access token for a report.

        Args:
            report: LegalReport instance
            expires_in_hours: Hours until token expires (None for no expiration)
            max_uses: Maximum number of times the token can be used

        Returns:
            AccessToken instance
        """
        expires_at = None
        if expires_in_hours:
            expires_at = timezone.now() + timedelta(hours=expires_in_hours)

        token = AccessToken.objects.create(
            report=report,
            client=report.client,
            expires_at=expires_at,
            max_uses=max_uses
        )

        return token

    @staticmethod
    def validate_token(token_string):
        """
        Validate a token string and return the AccessToken instance.

        Args:
            token_string: UUID token string

        Returns:
            Tuple of (AccessToken or None, error_message or None)
        """
        try:
            token = AccessToken.objects.select_related('report', 'client').get(token=token_string)
        except AccessToken.DoesNotExist:
            return None, "Invalid token"

        if token.is_revoked:
            return None, "Token has been revoked"

        if token.expires_at and timezone.now() > token.expires_at:
            return None, "Token has expired"

        if token.current_uses >= token.max_uses:
            return None, "Token usage limit exceeded"

        return token, None

    @staticmethod
    def log_access(token, ip_address, user_agent, download_completed=False):
        """
        Log an access attempt for a token.

        Args:
            token: AccessToken instance
            ip_address: IP address of the accessor
            user_agent: User agent string
            download_completed: Whether the download was completed

        Returns:
            TokenAccess instance
        """
        return TokenAccess.objects.create(
            token=token,
            ip_address=ip_address,
            user_agent=user_agent,
            download_completed=download_completed
        )
