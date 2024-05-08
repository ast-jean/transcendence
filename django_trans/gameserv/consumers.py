from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json

class GameConsumer(AsyncWebsocketConsumer):

    connected_clients = []
    rooms = []

    async def connect(self):
        self.id = str(uuid.uuid4())
        self.connected_clients.append(self)
        print(f"Consumer {self.id} has connected.")
        await self.accept()

    async def disconnect(self, close_code):
        self.connected_clients.remove(self)
        print(f"Consumer {self.id} has disconnected.")

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message')

        print("Client",self.id,":", message)

        # Process the message or perform actions based on the message
        # For example, echoing back the received message
        await self.send(text_data=json.dumps({
            'id': self.id,
            'message': message
        }))
        broadcast_message(cls, message)

 
@classmethod
async def broadcast_message(cls, message):
    for client in cls.connected_clients:
        await client.send(text_data=json.dumps({
            # 'id': client.id,
            'message': message
        }))
