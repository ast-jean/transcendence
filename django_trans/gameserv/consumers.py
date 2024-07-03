from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json

class GameConsumer(AsyncWebsocketConsumer):
    connected_clients = []
    rooms = []

    async def connect(self):
        self.ident = str(uuid.uuid4())
        GameConsumer.connected_clients.append(self)
        await self.broadcast_connect({"ident": "user_%s" % self.ident, 'cmd' : "connect"})
        print(f"Client {self.ident} has connected.")
        await self.accept()

    async def disconnect(self, close_code):
        self.connected_clients.remove(self)
        await self.broadcast_disconnect({"ident": "user_%s" % self.ident, 'cmd' : "disconnect"})
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
                await self.broadcast_disconnect(text_data_json)
            if text_data_json["cmd"] == "sync":
                await self.broadcast_move(text_data_json)
            if text_data_json["cmd"] == "ballMove":
                await self.broadcast_ball_move(text_data_json)

    async def broadcast_chat(self, data):
        for client in self.connected_clients:
            if client.ident != self.ident:
                await client.send(json.dumps(data))

    async def broadcast_move(self, data): #same as chat for now.
        for client in self.connected_clients:
            if client.ident != self.ident:
                await client.send(json.dumps(data))

    async def broadcast_connect(self, data): #same as chat for now.
        for client in self.connected_clients:
            if client.ident != self.ident:
                await client.send(json.dumps(data))

    async def broadcast_disconnect(self, data): #same as chat for now.
        for client in self.connected_clients:
            if client.ident != self.ident:
                await client.send(json.dumps(data))

    async def broadcast_ball_move(self, data):
        for client in self.connected_clients:
            if client.ident != self.ident:
                await client.send(json.dumps(data))




# import json

# class GameConsumer(AsyncWebsocketConsumer):
#     connected_clients = []
#     rooms = {}

#     async def connect(self):
#         self.ident = str(uuid.uuid4())
#         GameConsumer.connected_clients.append(self)
#         await self.accept()
#         print(f"Client {self.ident} has connected.")
#         await self.send(text_data=json.dumps({
#             'cmd': 'connect',
#             'ident': self.ident,
#         }))
#         await self.send(text_data=json.dumps({
#             'cmd': 'waiting_for_players',
#         }))
#         await self.check_start_game()

#     async def disconnect(self, close_code):
#         GameConsumer.connected_clients.remove(self)
#         print(f"Client {self.ident} has disconnected.")
#         await self.broadcast_connect({"ident": self.ident, 'cmd': "disconnect"})
#         await self.check_start_game()

#     async def receive(self, text_data):
#         if len(text_data) > 0:
#             text_data_json = json.loads(text_data)
#             text_data_json.update({"ident": self.ident})
#             if text_data_json["cmd"] == "chat":
#                 await self.broadcast_chat(text_data_json)
#             if text_data_json["cmd"] == "move":
#                 await self.broadcast_move(text_data_json)
#             if text_data_json["cmd"] == "connect":
#                 await self.broadcast_connect(text_data_json)
#             if text_data_json["cmd"] == "disconnect":
#                 await self.broadcast_connect(text_data_json)
#             if text_data_json["cmd"] == "sync":
#                 await self.broadcast_move(text_data_json)

#     async def broadcast_chat(self, data):
#         print(f"Broadcasting chat: {data}")
#         for client in self.connected_clients:
#             if client.ident != self.ident:
#                 await client.send(text_data=json.dumps(data))

#     async def broadcast_move(self, data):
#         print(f"Broadcasting move: {data}")
#         for client in self.connected_clients:
#             if client.ident != self.ident:
#                 await client.send(text_data=json.dumps(data))

#     async def broadcast_connect(self, data):
#         print(f"Broadcasting connect: {data}")
#         for client in self.connected_clients:
#             if client.ident != self.ident:
#                 await client.send(text_data=json.dumps(data))

#     async def check_start_game(self):
#         if len(self.connected_clients) >= 2:
#             await self.broadcast_message({'cmd': 'start_game'})
#         else:
#             await self.broadcast_message({'cmd': 'waiting_for_players'})

#     async def broadcast_message(self, message):
#         print(f"Broadcasting message: {message}")
#         for client in self.connected_clients:
#             await client.send(text_data=json.dumps(message))
