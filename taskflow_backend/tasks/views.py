from datetime import date, timedelta

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.mail import send_mail
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from .models import Task
from .serializers import TaskSerializer
from projects.models import ProjectMember
from notifications.models import Notification
from logs.models import ActivityLog


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['project', 'status', 'priority', 'assigned_to']
    search_fields = ['title', 'description']

    def _broadcast(self, project_id, event_type, payload):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'project_{project_id}',
            {
                'type': 'task_event',
                'event': event_type,
                'payload': payload,
            }
        )

    def _log_activity(self, user, action, object_type, object_id, changes, project):
        ActivityLog.objects.create(
            user=user,
            action=action,
            object_type=object_type,
            object_id=object_id,
            changes=changes or {},
            project=project,
        )

    def get_queryset(self):
        return Task.objects.filter(project__members=self.request.user)

    def get_serializer(self, *args, **kwargs):
        if self.request.method == 'PATCH':
            kwargs['partial'] = True
        return super().get_serializer(*args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        is_admin = ProjectMember.objects.filter(
            project=task.project,
            user=request.user,
            role='admin'
        ).exists()
        if not is_admin and not request.user.is_superuser:
            return Response(
                {'error': 'Only project admins can delete tasks'},
                status=status.HTTP_403_FORBIDDEN
            )

        project_id = task.project.id
        task_id = task.id
        response = super().destroy(request, *args, **kwargs)
        self._log_activity(request.user, 'DELETE', 'Task', task_id, {}, task.project)
        self._broadcast(project_id, 'task_deleted', {'id': task_id})
        self._broadcast(project_id, 'activity_log', {
            'event': 'task_deleted',
            'task_id': task_id,
            'user': request.user.username,
            'timestamp': date.today().isoformat(),
        })
        return response

    def perform_create(self, serializer):
        task = serializer.save()

        if task.assigned_to:
            Notification.objects.create(
                user=task.assigned_to,
                message=f"You have been assigned to task: {task.title}",
                type='task_assigned',
                task=task
            )
            if task.assigned_to.email:
                send_mail(
                    subject='Task Assigned: ' + task.title,
                    message=f'You have been assigned to task "{task.title}" in project "{task.project.name}".',
                    from_email=None,
                    recipient_list=[task.assigned_to.email],
                )

        self._log_activity(
            self.request.user,
            'CREATE',
            'Task',
            task.id,
            {
                'title': task.title,
                'status': task.status,
                'priority': task.priority,
                'assigned_to': task.assigned_to.id if task.assigned_to else None,
                'due_date': task.due_date.isoformat() if task.due_date else None,
            },
            task.project
        )

        self._broadcast(task.project.id, 'task_created', TaskSerializer(task).data)
        self._broadcast(task.project.id, 'activity_log', {
            'event': 'task_created',
            'task_id': task.id,
            'user': self.request.user.username,
            'timestamp': task.updated_at.isoformat(),
        })

    def perform_update(self, serializer):
        old_task = self.get_object()
        task = serializer.save()

        changes = {}
        for field in ['title', 'description', 'status', 'priority', 'due_date', 'assigned_to']:
            old_value = getattr(old_task, field)
            new_value = getattr(task, field)
            if field == 'assigned_to':
                old_value = old_value.id if old_value else None
                new_value = new_value.id if new_value else None
            if old_value != new_value:
                changes[field] = {'from': old_value, 'to': new_value}

        if task.assigned_to and task.assigned_to != old_task.assigned_to:
            Notification.objects.create(
                user=task.assigned_to,
                message=f"You have been assigned to task: {task.title}",
                type='task_assigned',
                task=task
            )
            if task.assigned_to.email:
                send_mail(
                    subject='Task Assignment Updated: ' + task.title,
                    message=f'You have been assigned to task "{task.title}" in project "{task.project.name}".',
                    from_email=None,
                    recipient_list=[task.assigned_to.email],
                )

        self._log_activity(
            self.request.user,
            'UPDATE',
            'Task',
            task.id,
            changes,
            task.project
        )

        self._broadcast(task.project.id, 'task_updated', TaskSerializer(task).data)
        self._broadcast(task.project.id, 'activity_log', {
            'event': 'task_updated',
            'task_id': task.id,
            'changes': changes,
            'user': self.request.user.username,
            'timestamp': task.updated_at.isoformat(),
        })

    @action(detail=False, methods=['get'])
    def due_reminders(self, request):
        today = date.today()
        upcoming = today + timedelta(days=1)
        due_tasks = Task.objects.filter(
            due_date__gte=today,
            due_date__lte=upcoming,
            assigned_to__isnull=False,
            project__members=request.user
        )

        created = 0
        for task in due_tasks:
            if not Notification.objects.filter(
                user=task.assigned_to,
                type='due_reminder',
                task=task
            ).exists():
                Notification.objects.create(
                    user=task.assigned_to,
                    message=f"Task due soon: {task.title} (due {task.due_date})",
                    type='due_reminder',
                    task=task
                )
                created += 1

                if task.assigned_to.email:
                    send_mail(
                        subject='Task Due Reminder: ' + task.title,
                        message=f'The task "{task.title}" is due on {task.due_date}.',
                        from_email=None,
                        recipient_list=[task.assigned_to.email],
                    )

        for task in due_tasks:
            self._broadcast(
                task.project.id,
                'task_due_reminder',
                {
                    'task_id': task.id,
                    'task_title': task.title,
                    'due_date': str(task.due_date)
                }
            )

        return Response({'created': created})

    # ← NEW: add comment to a task, accessible by any project member
    @action(detail=True, methods=['patch'], url_path='add-comment')
    def add_comment(self, request, pk=None):
        task = self.get_object()
        new_comment = request.data.get('comment', '').strip()

        if not new_comment:
            return Response(
                {'error': 'Comment cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.utils import timezone
        timestamp = timezone.now().strftime('%b %d, %Y %H:%M')
        formatted = f"[{request.user.username} — {timestamp}]: {new_comment}"

        existing = task.comments or ''
        task.comments = (existing + '\n' + formatted).strip()
        task.save()

        # Log the comment activity
        self._log_activity(
            request.user,
            'COMMENT',
            'Task',
            task.id,
            {'comment': new_comment},
            task.project
        )

        # Broadcast to project so others see it live
        self._broadcast(task.project.id, 'task_updated', TaskSerializer(task).data)

        return Response({'comments': task.comments})