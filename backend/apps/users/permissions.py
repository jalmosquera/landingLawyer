from rest_framework import permissions


class IsLawyer(permissions.BasePermission):
    """
    Custom permission to only allow lawyers to access certain endpoints.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['lawyer', 'admin']


class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admins to access certain endpoints.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'
