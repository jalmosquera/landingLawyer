"""
Custom permission classes for role-based access control.

Roles:
- boss: Full admin access (the lawyer/owner)
- employe: Staff member with partial access
- client: Limited portal access to own data
"""

from rest_framework.permissions import BasePermission


class IsBoss(BasePermission):
    """
    Permission class that allows access only to users with boss role.
    Boss has full administrative access to all resources.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'boss'


class IsEmploye(BasePermission):
    """
    Permission class that allows access only to users with employe role.
    Employe has staff access but may have some restrictions compared to boss.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'employe'


class IsStaff(BasePermission):
    """
    Permission class that allows access to both boss and employe roles.
    This is the primary permission for internal staff operations.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['boss', 'employe']


class IsClient(BasePermission):
    """
    Permission class that allows access only to users with client role.
    Clients have limited read-only access to their own data.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'client'


class IsStaffOrReadOnly(BasePermission):
    """
    Permission class that allows:
    - Public read access (GET, HEAD, OPTIONS)
    - Staff-only write access (POST, PUT, PATCH, DELETE)

    Used for public endpoints like services, testimonials, etc.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True

        # Write permissions are only allowed to staff (boss or employe)
        return request.user.is_authenticated and request.user.role in ['boss', 'employe']
