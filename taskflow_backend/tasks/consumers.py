import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from projects.models import ProjectMember

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token):
    try:
        data = AccessToken(token)
        user_id = data.get('user_id')
        return User.objects.get(id=user_id)
    except Exception:
        return None

@database_sync_to_async
def check_project_membership(project_id, user):
    if user is None:
        return False
    return ProjectMember.objects.filter(project_id=project_id, user=user).exists()

class ProjectTaskConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        query = parse_qs(self.scope['query_string'].decode())
        token = query.get('token', [None])[0]
        self.user = await get_user_from_token(token) if token else None
        self.project_id = self.scope['url_route']['kwargs'].get('project_id')

        if self.user is None or not await check_project_membership(self.project_id, self.user):
            await self.close()
            return

        self.group_name = f'project_{self.project_id}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def task_event(self, event):
        await self.send_json({
            'event': event.get('event'),
            'payload': event.get('payload'),
        })
