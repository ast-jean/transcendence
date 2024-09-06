from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json
from typing import List, Optional
import random

class Client:
    def __init__(self, ident, index, websocket):
        self.ident = ident
        self.index = index
        self.websocket = websocket
        self.team = "team1" if index % 2 == 0 else "team2"

class Room:
    def __init__(self, player_total, existing_room_ids, is_lobby=False):
        self.roomId = self.generate_room_id(existing_room_ids)
        self.clients: List[Client] = []
        self.playerIn = 0 
        self.playerTotal = player_total,
        self.scoreTeam1 = 0
        self.scoreTeam2 = 0
        self.host_ident = None  # Identifiant de l'hôte
        self.game_over = False
        self.isLobby = is_lobby



    # async def create_tournament_lobby(self):
    #     print("Creating new tournament lobby")
    #     new_room = Room(4, self.existing_room_ids, is_lobby=True)  # Room de lobby
    #     self.rooms.append(new_room)
    #     data = {
    #         "cmd": "joinLobby",
    #         "roomId": new_room.roomId,
    #         "playerIn": new_room.playerIn,
    #         "playerTotal": new_room.playerTotal,
    #     }
    #     await self.send(json.dumps(data))

    def check_all_players_ready(self):
        return self.playerIn == self.playerTotal and self.isLobby


    async def check_and_start_tournament(self, room):
        if room.check_all_players_ready():
            # Crée deux nouvelles rooms de jeu
            match_1_room = Room(2, self.existing_room_ids)
            match_2_room = Room(2, self.existing_room_ids)

            self.rooms.append(match_1_room)
            self.rooms.append(match_2_room)

            # Répartit les joueurs dans les deux rooms
            match_1_players = room.clients[:2]
            match_2_players = room.clients[2:]

            # Envoie chaque joueur dans leur nouvelle room
            for client in match_1_players:
                match_1_room.add_client(client)
                await client.websocket.send(json.dumps({
                    "cmd": "joinRoom",
                    "roomId": match_1_room.roomId,
                    "playerIn": match_1_room.playerIn,
                    "playerTotal": match_1_room.playerTotal,
                }))

            for client in match_2_players:
                match_2_room.add_client(client)
                await client.websocket.send(json.dumps({
                    "cmd": "joinRoom",
                    "roomId": match_2_room.roomId,
                    "playerIn": match_2_room.playerIn,
                    "playerTotal": match_2_room.playerTotal,
                }))
            
            # Supprime la room du lobby une fois les matchs lancés
            self.rooms.remove(room)


    async def notify_players_in_lobby(self, room):
        players_in_lobby = [{"ident": client.ident} for client in room.clients]
        data = {
            "cmd": "updateLobbyPlayers",
            "players": players_in_lobby
        }
        for client in room.clients:
            await client.websocket.send(json.dumps(data))






    def update_score(self, team):
        if team == "team1":
            self.scoreTeam1 += 1
        elif team == "team2":
            self.scoreTeam2 += 1
        return {"scoreTeam1": self.scoreTeam1, "scoreTeam2": self.scoreTeam2}

    def generate_room_id(self, existing_room_ids):
        lower_bound = 1000
        upper_bound = 9999
        room_id = random.randint(lower_bound, upper_bound)
        while room_id in existing_room_ids:
            room_id = random.randint(lower_bound, upper_bound)    
        existing_room_ids.append(room_id)
        return room_id
    
    def add_client(self, client) -> Optional[Client]:
        if self.playerIn < self.playerTotal[0]:
            self.clients.append(client)
            self.playerIn += 1
            if self.playerIn == 1:
                # Le premier joueur est l'hôte
                self.host_ident = client.ident
            return client
        else:
            return None

class GameConsumer(AsyncWebsocketConsumer):
    connected_clients = []
    rooms = []
    existing_room_ids = []

    async def find_room(self, room_id):
        for room in self.rooms:
            if str(room.roomId) == str(room_id):
                return room
        return None

    async def connect(self):
        self.ident = str(uuid.uuid4())
        GameConsumer.connected_clients.append(self)
        print(f"Client {self.ident} has connected.")
        await self.accept()

    async def disconnect(self, close_code):
        GameConsumer.connected_clients.remove(self)
        await self.broadcast_disconnect({"ident": "user_%s" % self.ident, 'cmd' : "disconnect"})
        print(f"Client {self.ident} has disconnected.")

    async def create_tournament_lobby(self):
        print("Creating new tournament lobby")
        new_room = Room(4, self.existing_room_ids, is_lobby=True)  # Room de lobby
        self.rooms.append(new_room)

        # Ajouter le joueur qui a créé le lobby comme premier client et hôte
        new_client = Client(self.ident, 0, self)
        new_room.add_client(new_client)

        # Envoie la room_id au client après la création
        data = {
            "cmd": "joinLobby",
            "roomId": new_room.roomId,
            "playerIn": new_room.playerIn,
            "playerTotal": new_room.playerTotal,
            "host": True  # Marque ce client comme l'hôte
        }
        await self.send(json.dumps(data))

        # Notifie les autres joueurs du lobby des mises à jour
        await self.notify_players_in_lobby(new_room)



    async def receive(self, text_data):
        if len(text_data) > 0:
            text_data_json = json.loads(text_data)
            text_data_json.update({"ident": "user_%s" % self.ident})

            cmd = text_data_json.get("cmd")

            if cmd == "chat":
                await self.broadcast_chat(text_data_json)
            elif cmd == "move":
                await self.broadcast_move(text_data_json)
            elif cmd == "connect":
                await self.broadcast_connect(text_data_json)
            elif cmd == "disconnect":
                await self.broadcast_disconnect(text_data_json)
            elif cmd == "sync":
                await self.broadcast_move(text_data_json)
            elif cmd == "ballSync":
                await self.broadcast_ball_sync(text_data_json)
            elif cmd == "roomSearch":
                await self.searchRoom(text_data_json)
            elif cmd == "roomCreate2":
                await self.createRoom(2)
            elif cmd == "roomCreate4":
                await self.createRoom(4)
            elif cmd == "tournamentLobby":
                await self.create_tournament_lobby() 
            elif cmd == "score":
                room = await self.find_room(text_data_json["roomId"])
                if self.ident == room.host_ident:
                    score_data = room.update_score(text_data_json["team"])
                    await self.broadcast_score_update(room, score_data)
                else:
                    print(f"Client {self.ident} is not the host and cannot update the score.")

    async def broadcast_score_update(self, room, score_data):
        data = {
            "cmd": "scoreUpdate",
            "scoreTeam1": score_data["scoreTeam1"],
            "scoreTeam2": score_data["scoreTeam2"]
        }
        for client in room.clients:
            await client.websocket.send(json.dumps(data))


    async def broadcast_ball_sync(self, data):
        for client in self.connected_clients:
            if client.ident != self.ident:
                await client.send(json.dumps(data))

    async def broadcast_chat(self, data):
        room = await self.find_room(data['roomId'])
        if room is not None:
            for client in room.clients:
                if client.ident != self.ident:
                    await client.websocket.send(json.dumps(data))

    async def broadcast_move(self, data):
        room = await self.find_room(data['roomId'])
        if room is not None:
            for client in room.clients:
                if client.ident != self.ident:
                    await client.websocket.send(json.dumps(data))

    async def broadcast_connect(self, data):
        for client in self.connected_clients:
            if client.ident != self.ident:
                await client.send(json.dumps(data))

    async def broadcast_disconnect(self, data):
        for client in self.connected_clients:
            if client.ident != self.ident:
                await client.send(json.dumps(data))

    async def broadcast_ball_move(self, data):
        room = await self.find_room(data['roomId'])
        if room is not None:
            for client in room.clients:
                if client.ident != self.ident:
                    await client.websocket.send(json.dumps(data))

    async def createRoom(self, playerTotal):
        print(f"Creating new room of {playerTotal}")
        try:
            new_room = Room(int(playerTotal), self.existing_room_ids)
            self.rooms.append(new_room)
            new_room.add_client(Client(self.ident, 0, self))
            data = {
                "cmd": "joinRoom",
                "roomId": new_room.roomId,
                "playerIn": new_room.playerIn,
                "playerTotal": new_room.playerTotal,
                "clientId": 0
            }
            await self.send(json.dumps(data))
        except Exception as e:
            print(f"Error creating room: {str(e)}")

    async def searchRoom(self, data):
        try:
            print(f"\033[33mClient {self.ident} is searching for room {data['roomId']}\033[0m")
            print(f"\033[91m Rooms: {self.rooms} \033[0m")
            print(f"{data['roomId']}")
            found_room = await self.find_room(data['roomId'])
            if found_room is None:
                raise Exception(f"\033[31mRoom {data['roomId']} not found.\033[0m]")
            else:
                print(f"\033[32mRoom found: { found_room }\033[0m")
                new_client = Client(self.ident, found_room.playerIn, self)
                found_room.add_client(new_client)
                
                # Envoyer les informations des joueurs existants au nouveau joueur
                existing_players = [{"ident": client.ident, "index": client.index} for client in found_room.clients if client.ident != self.ident]
                await self.send(text_data=json.dumps({
                    "cmd": "existingPlayers",
                    "players": existing_players
                }))
                
                data = {
                    "cmd": "joinRoom", 
                    "roomId": found_room.roomId,
                    "playerIn": found_room.playerIn,
                    "playerTotal": found_room.playerTotal[0],
                    'clientId': new_client.index,
                }
                await self.send(json.dumps(data))
                await self.broadcast_connect({"ident": "user_%s" % self.ident, 'cmd' : "connect"})
        except Exception as e:
            print(f"Error searching room: {str(e)}")
            await self.send(json.dumps({'cmd':'roomNotFound'}))


# Exemple de donnees dans data
# {
#     "cmd": "endGame",
#     "gameId": 1,
#     "players": [
#         {"username": "player1", "score": 10, "winner": True, "team": 1},
#         {"username": "player2", "score": 5, "winner": False, "team": 2}
#     ]
# }
    async def save_game_result(self, game_id, players_data):
        from main.models import Game, Player  # Import moved inside the function
        from django.contrib.auth import get_user_model
        CustomUser = get_user_model()
        try:
            # Create a new game instance
            game = Game.objects.create()
            
            # Iterate over the player data and create Player instances
            for player_data in players_data:
                user = CustomUser.objects.get(username=player_data['username'])
                Player.objects.create(
                    user=user,
                    game=game,
                    score=player_data['score'],
                    winner=player_data['winner'],
                    team=player_data['team']
                )
            print(f"Game {game.id} saved successfully with {len(players_data)} players.")
        except Exception as e:
            print(f"Error saving game result: {str(e)}")