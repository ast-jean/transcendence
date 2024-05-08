from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json

class GameConsumer(AsyncWebsocketConsumer):

	connected_clients = []
	# rooms = [] for later use

	async def connect(self):
		self.ident = str(uuid.uuid4())
		GameConsumer.connected_clients.append(self)
		print(f"Consumer {self.ident} has connected.")
		await self.accept()

	async def disconnect(self, close_code):
		self.connected_clients.remove(self)
		print(f"Consumer {self.ident} has disconnected.")

	async def receive(self, text_data):
		if len(text_data) > 0:
			text_data_json = json.loads(text_data)
			text_data_json.update({f"ident" : "{self.ident}"})
		if text_data_json["cmd"] == "chat":
			print(text_data_json["data"])
			await self.broadcast_chat(text_data_json)

	async def broadcast_chat(self, data):
		print("hello")
		print("len=",len(self.connected_clients))
		for client in self.connected_clients:
			print(client.ident)
			if client.ident != self.ident:
				await client.send(json.dumps(data))
