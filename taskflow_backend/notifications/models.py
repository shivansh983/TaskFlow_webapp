from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPES = (
        ('task_assigned', 'Task Assigned'),
        ('due_reminder', 'Due Date Reminder'),
        ('invite', 'Project Invite'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    task = models.ForeignKey('tasks.Task', on_delete=models.CASCADE, null=True, blank=True)
    related_project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        app_label = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} - {self.message}"