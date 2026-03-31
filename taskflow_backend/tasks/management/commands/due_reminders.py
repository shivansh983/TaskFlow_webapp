from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from datetime import date, timedelta
from tasks.models import Task
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Create due date reminder notifications for tasks due today/tomorrow.'

    def handle(self, *args, **kwargs):
        today = date.today()
        upcoming = today + timedelta(days=1)

        due_tasks = Task.objects.filter(
            due_date__gte=today,
            due_date__lte=upcoming,
            assigned_to__isnull=False
        )

        created = 0
        for task in due_tasks:
            if not Notification.objects.filter(user=task.assigned_to, type='due_reminder', task=task).exists():
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
                        message=f'Task "{task.title}" is due on {task.due_date}.',
                        from_email=None,
                        recipient_list=[task.assigned_to.email],
                    )

        self.stdout.write(self.style.SUCCESS(f'Due reminder notifications created: {created}'))
