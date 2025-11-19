from django.contrib import admin
from .models import AccessToken, TokenAccess


class TokenAccessInline(admin.TabularInline):
    model = TokenAccess
    extra = 0
    readonly_fields = ('accessed_at', 'ip_address', 'user_agent', 'download_completed')
    can_delete = False


@admin.register(AccessToken)
class AccessTokenAdmin(admin.ModelAdmin):
    list_display = ('token', 'report', 'client', 'expires_at', 'current_uses', 'max_uses', 'is_revoked', 'created_at')
    list_filter = ('is_revoked', 'created_at', 'expires_at')
    search_fields = ('token', 'report__title', 'client__full_name')
    readonly_fields = ('token', 'current_uses', 'created_at', 'revoked_at')
    inlines = [TokenAccessInline]

    fieldsets = (
        ('Token Information', {
            'fields': ('token', 'report', 'client')
        }),
        ('Expiration & Usage', {
            'fields': ('expires_at', 'max_uses', 'current_uses')
        }),
        ('Status', {
            'fields': ('is_revoked', 'revoked_at', 'created_at')
        }),
    )


@admin.register(TokenAccess)
class TokenAccessAdmin(admin.ModelAdmin):
    list_display = ('token', 'ip_address', 'accessed_at', 'download_completed')
    list_filter = ('download_completed', 'accessed_at')
    search_fields = ('token__token', 'ip_address')
    readonly_fields = ('accessed_at',)
