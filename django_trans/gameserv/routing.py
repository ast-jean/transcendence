from django.urls import re_path
from .consumers import GameConsumer
from .consumers_truck import GameConsumer_truck

websocket_urlpatterns = [
    re_path(r'^ws/pong/$', GameConsumer.as_asgi()),
    re_path(r'^ws/truck/$', GameConsumer_truck.as_asgi()),
]