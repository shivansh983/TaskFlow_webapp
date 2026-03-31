from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from .models import Project, ProjectMember
from .serializers import ProjectSerializer, ProjectMemberSerializer
from users.permissions import IsGlobalAdmin, IsManagerOrAdmin  # import IsGlobalAdmin
from rest_framework.filters import SearchFilter
from notifications.models import Notification

User = get_user_model()

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name', 'description']

    def get_permissions(self):
        # Temporarily allow any authenticated user to create projects for testing
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated]  # Changed from IsGlobalAdmin
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsManagerOrAdmin]
        elif self.action in ['invite_user', 'update_member_role', 'remove_member']:
            permission_classes = [IsManagerOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':  # Global admins can see all projects
            return Project.objects.all()
        return Project.objects.filter(members=user)

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        # Add creator as admin
        ProjectMember.objects.create(
            user=self.request.user,
            project=project,
            role='admin'
        )

    @action(detail=True, methods=['post'])
    def invite_user(self, request, pk=None):
        project = self.get_object()
        username_or_email = request.data.get('username_or_email')
        role = request.data.get('role', 'member')

        # Try to find user by username or email
        user = None
        try:
            user = User.objects.get(username=username_or_email)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=username_or_email)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found. Make sure they have registered first.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Check if already a member
        if ProjectMember.objects.filter(project=project, user=user).exists():
            return Response(
                {'error': 'User is already a member of this project.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Add user to project
        ProjectMember.objects.create(
            user=user,
            project=project,
            role=role
        )

        # Create notification for the invited user
        Notification.objects.create(
            user=user,
            message=f'You have been invited to join the project "{project.name}" as a {role}.',
            type='invite',
            related_project=project
        )

        # Send email notification
        send_mail(
            subject=f'Invitation to join project "{project.name}"',
            message=f'Hello {user.username},\n\nYou have been invited to join the project "{project.name}" as a {role}.\n\nYou can now access the project in TaskFlow.\n\nBest regards,\nTaskFlow Team',
            from_email=None,  # Uses DEFAULT_FROM_EMAIL
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({'message': f'User {user.username} invited successfully!'})

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        project = self.get_object()
        members = ProjectMember.objects.filter(project=project)
        serializer = ProjectMemberSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['put'])
    def update_member_role(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        new_role = request.data.get('role')

        try:
            member = ProjectMember.objects.get(project=project, user_id=user_id)
            member.role = new_role
            member.save()
            return Response({'message': 'Role updated successfully!'})
        except ProjectMember.DoesNotExist:
            return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')

        # Don't allow removing the creator if they're the only admin
        member = ProjectMember.objects.filter(project=project, user_id=user_id)
        if member.exists():
            member.delete()
            return Response({'message': 'Member removed successfully!'})

        return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context