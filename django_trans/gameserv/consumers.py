from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json

class GameConsumer(AsyncWebsocketConsumer):
	connected_clients = []
	# rooms = [] for later use

	async def connect(self):
		self.ident = str(uuid.uuid4())
		GameConsumer.connected_clients.append(self)
		await self.broadcast_connect({"ident": "user_%s" % self.ident, 'cmd' : "connect"})
		# print(f"Client {self.ident} has connected.")
		await self.accept()

	async def disconnect(self, close_code):
		self.connected_clients.remove(self)
		await self.broadcast_connect({"ident": "user_%s" % self.ident,'cmd' : "disconnect"})
		print(f"Client {self.ident} has disconnected.")

	async def receive(self, text_data):
		if len(text_data) > 0:
			text_data_json = json.loads(text_data)
			text_data_json.update({"ident": "user_%s" % self.ident}) #adds the player id
			if text_data_json["cmd"] == "chat":
				await self.broadcast_chat(text_data_json)
			if text_data_json["cmd"] == "move":
				await self.broadcast_move(text_data_json)
			if text_data_json["cmd"] == "connect":
				await self.broadcast_connect(text_data_json)
			if text_data_json["cmd"] == "disconnect":
				await self.broadcast_connect(text_data_json)

	async def broadcast_chat(self, data):
		for client in self.connected_clients:
			if client.ident != self.ident:
				await client.send(json.dumps(data))

	async def broadcast_move(self, data): #same has chat for now.
		for client in self.connected_clients:
			if client.ident != self.ident:
				await client.send(json.dumps(data))

	async def broadcast_connect(self, data): #same has chat for now.
		for client in self.connected_clients:
			if client.ident != self.ident:
				await client.send(json.dumps(data))
