from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json
import random

class GameConsumer_truck(AsyncWebsocketConsumer):
	connected_clients = []
	rooms = []
	existing_room_ids = []

	async def find_room(self, room_id):
		print("In find_room()")
		for room in self.rooms:
			print(f"Do {room['roomId']} = {room_id}?")
			if str(room['roomId']) == str(room_id):
				return room
		return None

	async def find_and_add_client(self, room_id):
		room = await self.find_room(room_id)
		if room is None:
			return print(f" Exiting find_add_client() with None"), None
		print(f"\033[93mFound var room={room} \033[0m")
		
		clients_ident = [client['ident'] for client in room['clients'] if isinstance(client, dict) and 'ident' in client]
		print(f"clients_ident={clients_ident}")
		if self.ident not in clients_ident:
			self.add_client_self(room)
			room['playerIn'] += 1
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
			if text_data_json["cmd"] == "move":
				await self.broadcast_move(text_data_json)
			if text_data_json["cmd"] == "connect":
				await self.broadcast_connect(text_data_json)
			if text_data_json["cmd"] == "disconnect":
				await self.broadcast_disconnect(text_data_json)
			if text_data_json["cmd"] == "sync":
				await self.broadcast_move(text_data_json)
			if text_data_json["cmd"] == "roomSearch":
				await self.searchRoom(text_data_json)
			if text_data_json["cmd"] == "roomCreate2":
				await self.createRoom2()
			if text_data_json["cmd"] == "roomCreate4":
				await self.createRoom4()

	def generate_room_id(self):
		lower_bound=1000
		upper_bound=9999
		room_id = random.randint(lower_bound, upper_bound)
		while room_id in self.existing_room_ids:
			room_id = random.randint(lower_bound, upper_bound)	
		self.existing_room_ids.append(room_id)
		return room_id
	
	async def createRoom2(self):
		print("Creating new room 2 ")
		try:
			room_Id = self.generate_room_id()
			data = {
				"cmd": "roomCreated",
				"roomId": room_Id,
				"players": [], 
				"playerIn": 1,
				"playerTotal": 2,
				"status": "waiting"
			}
			self.add_room(room_Id, 2)
			for client in self.connected_clients:
				if client.ident == self.ident:
					await client.send(json.dumps(data))
		except Exception as e:
			print(f"Error creating room: {str(e)}")

	async def createRoom4(self):
		print("Creating new room 4")
		try:
			room_Id = self.generate_room_id()
			data = {
				"cmd": "roomCreated",
				"roomId": room_Id,
				"score": {"team1": 0,"team2": 0},
				"playerIn": 1,
				"playerTotal": 4,
				"status": "waiting"
			}
			await self.add_room(room_Id, 4)
			print(f"Create Room, {self.rooms}")
			for client in self.connected_clients:
				if client.ident == self.ident:
			# 		await self.find_and_add_client(room_Id, self.ident)
			# 		print(f"Client, {self.ident}")
					await client.send(json.dumps(data))
		except Exception as e:
			print(f"Error creating room: {str(e)}")

	async def checkGameStart(self, room):
		if room['playerIn'] == room['playerTotal']:
			room['status'] = "started"
			for client in room['clients']:
				if client.ident != self.ident:
					await client.send(json.dumps({'cmd': "StartGame"}))
			print("GameStarting")
		
	async def searchRoom(self, data):
		print(f"Client {self.ident} is searching for room {data['roomId']}")
		found_room = await self.find_and_add_client(data['roomId'])
		if found_room is not None:
			print(f"Room found: { found_room }")
			data = {
				"cmd": "roomFound", 
				"roomId": found_room["roomId"]
			}
			for client in self.connected_clients:
				if client.ident == self.ident:
					await client.send(json.dumps(data))
			await self.checkGameStart(found_room)
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

	async def broadcast_gameStart(self, data):
		for client in self.connected_clients:
			if client.ident != self.ident:
				await client.send(json.dumps(data))

	async def broadcast_connect(self, data):
		for client in self.connected_clients:
			if client.ident != self.ident:
				await client.send(json.dumps(data))

	async def broadcast_disconnect(self, data):
		for client in self.connected_clients:
			if client.ident != self.ident:
				await client.send(json.dumps(data))
				
	def add_client_self(self, room):
		client = {
			'ident': self.ident
		}
		room['clients'].append(client)

	async def add_room(self, room_id, player_total):
		print("In add_room()")
		room = {
			'roomId': room_id,
			'clients': [], 
			'playerIn': 1,
			'playerTotal': player_total,
			'status': "waiting"
		}
		self.rooms.append(room)
		self.add_client_self(room)
		print(f"Room {room_id} created and added to the list.")
		
	async def update_room(self, room_id, new_player_in = None, new_status = None):
		for room in self.rooms:
			if room["roomId"] == room_id:
				if new_player_in is not None:
					room["playerIn"] = new_player_in
				if new_status is not None:
					room["status"] = new_status
				print(f"Updated room {room_id}: Players - {room['playerIn']}, Status - {room['status']}")
