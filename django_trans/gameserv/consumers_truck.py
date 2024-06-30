from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json
from typing import List, Optional
import random

# class Game:
# 	def __init__(self):
# 		self.team1 = []
# 		self.team2 = []
# 		self.scoreTeam1 = 0
# 		self.scoreTeam2 = 0

class Client:
	def __init__(self, ident, index):
		self.ident = ident
		self.index = index
		self.team = "team1" if index % 2 == 0 else "team2"

class Room:
	def __init__(self, player_total, existing_room_ids):
		self.roomId = self.generate_room_id(existing_room_ids)
		self.clients: List[Client] = []
		self.playerIn = 0 
		self.playerTotal = player_total,
		self.scoreTeam1 = 0
		self.scoreTeam2 = 0

	def generate_room_id(self, existing_room_ids):
		lower_bound=1000
		upper_bound=9999
		room_id = random.randint(lower_bound, upper_bound)
		while room_id in existing_room_ids:
			room_id = random.randint(lower_bound, upper_bound)	
		existing_room_ids.append(room_id)
		return room_id
	
	def add_client(self, client) -> Optional[Client]:
		if self.playerIn < self.playerTotal:
			self.clients.append(client)
			self.playerIn += 1
			return client
		else:
			return None
	
		
class GameConsumer_truck(AsyncWebsocketConsumer):
	connected_clients = []
	rooms = []
	existing_room_ids = []

	async def find_room(self, room_id):
		for room in self.rooms:
			if room.roomId == room_id:
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
		print(f"Client {self.ident} has disconnected with code {close_code}.")

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
				await self.broadcast_sync(text_data_json)
			if text_data_json["cmd"] == "roomSearch":
				await self.searchRoom(text_data_json)
			if text_data_json["cmd"] == "roomCreate2":
				await self.createRoom(2)
			if text_data_json["cmd"] == "roomCreate4":
				await self.createRoom(4)

	
	async def createRoom(self, playerTotal):
		print(f"Creating new room of {playerTotal}")
		try:
			new_room = Room(playerTotal, self.existing_room_ids)
			self.rooms.append(new_room)
			new_room.add_client(Client(self.ident, 0))
			data = {
				"cmd": "roomCreated",
				"roomId": new_room.roomId,
				"playerIn": new_room.playerIn,
				"playerTotal": new_room.playerTotal,
			}
			await self.send(json.dumps(data))
		except Exception as e:
			print(f"Error creating room: {str(e)}")

	async def checkGameStart(self, room):
		if room['playerIn'] == room['playerTotal']:
			room['status'] = "started"
			for client in room['clients']:
				if client.ident != self.ident:
					await client.send(json.dumps({'cmd': "StartGame"}))
			print("GameStarting")
		self.startGame() #dont wait 

	async def startGame():
		#while(game is not over):
			#if player disconnect
				#forfeit -> gameover
			
			print("In startGame")


	async def searchRoom(self, data):
		try:
			print(f"Client {self.ident} is searching for room {data['roomId']}")
			found_room = await self.find_room(data['roomId'])
			if found_room is None:
				raise Exception
			else:
				print(f"Room found: { found_room }")
				new_client = Client(self.ident, found_room.playerIn)
				found_room.add_Client(new_client)
				data = {
					"cmd": "roomFound", 
					"roomId": found_room.room_Id,
					'clientId': new_client.index,
				}
				await self.send(json.dumps(data))
				await self.checkGameStart(found_room)
		except Exception as e:
			print(f"Error creating room: {str(e)}")
			await self.send({'cmd':'roomNotFound'})


	async def broadcast_move(self, data):
		for client in self.connected_clients:
			if client.ident != self.ident:
				await client.send(json.dumps(data))

	async def broadcast_sync(self, data):
		print(f"\033[93mdata: ${data} \033[0m]")
		room = await self.find_room(data['room_id'])
		if room is not None:
			for client in room:
				if client.ident != self.ident:
					await client.send(json.dumps(data))

	async def broadcast_gameStart(self, data): #assign a team to the connected player and a player index
		room = await self.find_room(data['room_id'])
		for client in room:
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
