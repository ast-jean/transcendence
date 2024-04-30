"""
ASGI config for django_trans project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from gameserv.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project_name.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Django's ASGI application to handle traditional HTTP requests
    "websocket": AuthMiddlewareStack(  # WebSocket handler
        URLRouter(
            websocket_urlpatterns  # Use the routing configuration defined in gameserv/routing.py
            # gameserv.routing.websocket_urlpatterns  # Use the routing configuration defined in gameserv/routing.py
        )
    ),
})
