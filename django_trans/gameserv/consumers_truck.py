from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json
import random

class GameConsumer_truck(AsyncWebsocketConsumer):
	connected_clients = []
	rooms = []
	existing_room_ids = []

	async def find_room(self, room_id):
		for room in self.rooms:
			if room['roomId'] == room_id:
				return room
		return None

	async def find_and_add_client(self, room_id, client_ident):
		for room in self.rooms:
			if room['roomId'] == room_id:
				if client_ident not in room['clients']:
					room['clients'].append(client_ident)
				return room
		return None


	async def connect(self):
		self.ident = str(uuid.uuid4())
		GameConsumer_truck.connected_clients.append(self)
		await self.broadcast_connect({"ident": "user_%s" % self.ident, 'cmd' : "connect"})
		await self.accept()

	async def disconnect(self, close_code):
		self.connected_clients.remove(self)
		await self.broadcast_connect({"ident": "user_%s" % self.ident,'cmd' : "disconnect"})
		print(f"Client {self.ident} has disconnected.")

	async def receive(self, text_data):
		print(text_data)
		if len(text_data) > 0:
			text_data_json = json.loads(text_data)
			text_data_json.update({"ident": "user_%s" % self.ident}) #adds the player id
			# if text_data_json["cmd"] == "chat":
			# 	await self.broadcast_chat(text_data_json)
			if text_data_json["cmd"] == "move":
				await self.broadcast_move(text_data_json)
			if text_data_json["cmd"] == "connect":
				await self.broadcast_connect(text_data_json)
			if text_data_json["cmd"] == "disconnect":
				await self.broadcast_connect(text_data_json)
			if text_data_json["cmd"] == "sync":
				await self.broadcast_move(text_data_json)
			if text_data_json["cmd"] == "roomSearch":
				await self.searchRoom(text_data_json)
			if text_data_json["cmd"] == "roomCreate2":
				await self.createRoom2()
			if text_data_json["cmd"] == "roomCreate4":
				await self.createRoom4()
	# async def broadcast_chat(self, data):
	# 	for client in self.connected_clients:
	# 		if client.ident != self.ident:
	# 			await client.send(json.dumps(data))


	def generate_room_id(self):
		print("id generator")
		lower_bound=1000
		upper_bound=9999
		room_id = random.randint(lower_bound, upper_bound)
		while room_id in self.existing_room_ids:
			room_id = random.randint(lower_bound, upper_bound)	
		self.existing_room_ids.append(room_id)
		return room_id



	async def create_room(self, num_players):
		print(f"Creating new room for {num_players} players.")
		try:
			room_id = self.generate_room_id()
			data = {
				"cmd": "roomCreated",
				"roomId": room_id,
				"numPlayers": num_players  # Include the number of players in the data if needed
			}
			# Assuming 'connected_clients' is a list of client objects with an 'ident' attribute
			for client in self.connected_clients:
				if client.ident == self.ident:
					await self.find_and_add_client(room_id, self.ident)
					await client.send(json.dumps(data))
					break  # Stop the loop once the initiating client is processed
		except Exception as e:
			print(f"Error creating room: {str(e)}")



	async def createRoom2(self):
		print("Creating new room")
		try:
			room_Id = self.generate_room_id()
			data = {
				"cmd": "roomCreated",
				"roomId": room_Id
			}
			for client in self.connected_clients:
				if client.ident == self.ident:
					await self.find_and_add_client(room_Id, self.ident)
					await client.send(json.dumps(data))
		except Exception as e:
			print(f"Error creating room: {str(e)}")

	async def createRoom4(self):
		print("Creating new room")
		try:
			room_Id = self.generate_room_id()
			data = {
				"cmd": "roomCreated",
				"roomId": room_Id
			}
			for client in self.connected_clients:
				if client.ident == self.ident:
					await self.find_and_add_client(room_Id, self.ident)
					await client.send(json.dumps(data))
		except Exception as e:
			print(f"Error creating room: {str(e)}")

	async def searchRoom(self, data):
		print(f"Client {self.ident} is searching for room {data['roomId']}")
		found_room = await self.find_room(data['roomId'])
		if found_room != None:
			print(f"Room found: { found_room }")
			await self.find_and_add_client(data['roomId'], data['ident'])
		else:
			print(f"Room found: { found_room }")
			data = {
				"cmd": "roomNotFound"
			}
			for client in self.connected_clients:
				if client.ident == self.ident:
					await client.send(json.dumps(data))

	async def broadcast_move(self, data):
		for client in self.connected_clients:
			if client.ident != self.ident:
				await client.send(json.dumps(data))

	async def broadcast_connect(self, data):
		for client in self.connected_clients:
			if client.ident != self.ident:
				await client.send(json.dumps(data))
