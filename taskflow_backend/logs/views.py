from rest_framework import viewsets, permissions
from .models import ActivityLog
from .serializers import ActivityLogSerializer
from projects.models import Project

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.none()  # placeholder – overridden in get_queryset
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_projects = Project.objects.filter(members=user)

        queryset = ActivityLog.objects.filter(project__in=user_projects).order_by('-timestamp')
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset