from rest_framework.permissions import BasePermission

class IsGlobalAdmin(BasePermission):
    """Allows access only to users with global role 'admin'."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsAdmin(BasePermission):
    """Allows access only to users with global role 'admin'."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsManagerOrAdmin(BasePermission):
    """Allows access to users who are project admins or global admins."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        # Allow project creator to manage
        if obj.created_by == request.user:
            return True
        from projects.models import ProjectMember
        return ProjectMember.objects.filter(
            project=obj,
            user=request.user,
            role='admin'
        ).exists()

    def has_permission(self, request, view):
        return request.user.is_authenticated