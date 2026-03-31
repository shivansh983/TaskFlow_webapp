from django.urls import re_path
from .consumers import ProjectTaskConsumer

websocket_urlpatterns = [
    re_path(r'ws/projects/(?P<project_id>[^/]+)/$', ProjectTaskConsumer.as_asgi()),
]
