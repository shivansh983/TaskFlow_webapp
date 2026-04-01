import os
import django
from django.core.asgi import get_asgi_application

# Set settings early
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskflow_backend.settings')
django.setup()

# Import Channels components after django.setup()
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter

# Initialize the standard Django ASGI app
django_asgi_app = get_asgi_application()

# Import your routing here to avoid AppRegistryNotReady errors
import tasks.routing

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(
            tasks.routing.websocket_urlpatterns
        )
    ),
})
