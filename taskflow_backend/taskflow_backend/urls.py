from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from projects.views import ProjectViewSet
from tasks.views import TaskViewSet
from users.views import RegisterView
from logs.views import ActivityLogViewSet          # add this import
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from users.views import CurrentUserView
from notifications.views import NotificationViewSet



router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'activity-logs', ActivityLogViewSet)   # add this line
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/me/', CurrentUserView.as_view(), name='current_user'),
    path('api/tasks/due-reminders/', TaskViewSet.as_view({'get': 'due_reminders'}), name='task-due-reminders'),
]