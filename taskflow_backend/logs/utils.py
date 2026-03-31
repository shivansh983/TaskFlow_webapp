from .models import ActivityLog
from projects.models import Project

def log_activity(user, action, obj, changes=None):
    """Create an activity log entry."""
    if not user or not user.is_authenticated:
        return

    # Determine the project associated with the object
    project = None
    if hasattr(obj, 'project'):
        project = obj.project
    elif isinstance(obj, Project):
        project = obj

    ActivityLog.objects.create(
        user=user,
        action=action,
        object_type=obj.__class__.__name__,
        object_id=obj.id,
        changes=changes or {},
        project=project
    )