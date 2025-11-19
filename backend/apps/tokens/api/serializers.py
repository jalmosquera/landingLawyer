from rest_framework import serializers
from apps.tokens.models import AccessToken, TokenAccess


class TokenAccessSerializer(serializers.ModelSerializer):
    """
    Serializer for token access logs.
    """

    class Meta:
        model = TokenAccess
        fields = ['id', 'ip_address', 'user_agent', 'download_completed', 'accessed_at']
        read_only_fields = ['id', 'accessed_at']


class AccessTokenSerializer(serializers.ModelSerializer):
    """
    Serializer for access tokens.
    """
    report_title = serializers.CharField(source='report.title', read_only=True)
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    is_valid = serializers.SerializerMethodField()
    access_logs = TokenAccessSerializer(many=True, read_only=True)

    class Meta:
        model = AccessToken
        fields = [
            'id', 'token', 'report', 'report_title', 'client', 'client_name',
            'expires_at', 'max_uses', 'current_uses', 'is_revoked',
            'is_valid', 'access_logs', 'created_at', 'revoked_at'
        ]
        read_only_fields = ['id', 'token', 'current_uses', 'created_at', 'revoked_at']

    def get_is_valid(self, obj):
        return obj.is_valid()


class TokenGenerateSerializer(serializers.Serializer):
    """
    Serializer for token generation request.
    """
    report_id = serializers.IntegerField(required=True)
    expires_in_hours = serializers.IntegerField(required=False, default=24, min_value=1, max_value=8760)
    max_uses = serializers.IntegerField(required=False, default=1, min_value=1, max_value=100)


class TokenValidateSerializer(serializers.Serializer):
    """
    Serializer for token validation response.
    """
    token = serializers.UUIDField()
    report_title = serializers.CharField()
    download_url = serializers.URLField()
    expires_at = serializers.DateTimeField(allow_null=True)
    remaining_uses = serializers.IntegerField()
