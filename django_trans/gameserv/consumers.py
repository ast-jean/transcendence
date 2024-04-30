from channels.generic.websocket import AsyncWebsocketConsumer
import json

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'game_room_{self.room_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Start listening to location broadcasts in a background task
        await self.channel_layer.send(self.channel_name, {
            "type": "start_subscribe",
            "room_id": self.room_id
        })

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        player_id = text_data_json['player_id']
        x = text_data_json['x']
        y = text_data_json['y']
        z = text_data_json['z']

        # Update player location in Redis
        update_player_location(self.room_id, player_id, x, y, z)

        # Broadcast locations to room group
        broadcast_locations(self.room_id)

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))

    async def start_subscribe(self, event):
        # This would ideally be offloaded to a separate thread or handled differently
        # since it's a blocking operation
        subscribe_to_locations(event['room_id'])
