from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json
from typing import List, Optional
import random
from .tournament import *


class Client:
    def __init__(self, ident, index, websocket, name):
        self.ident = ident
        self.name = name
        self.index = index
        self.websocket = websocket
        self.team = "team1" if index % 2 == 0 else "team2"

    def to_dict(self):
        return {
            'ident': self.ident,
            'index': self.index,
            'team': self.team
        }

class Room:
    def __init__(self, player_total, existing_room_ids, is_lobby=False):
        self.roomId = self.generate_room_id(existing_room_ids)
        self.clients: List[Client] = []
        self.playerIn = 0 
        self.playerTotal = player_total
        self.scoreTeam1 = 0
        self.scoreTeam2 = 0
        self.host_ident = None  # Identifiant de l'hôte
        self.game_over = False
        self.isLobby = is_lobby

    @staticmethod
    def generate_room_id(existing_room_ids):
        lower_bound = 1000
        upper_bound = 9999
        room_id = random.randint(lower_bound, upper_bound)
        while room_id in existing_room_ids:
            room_id = random.randint(lower_bound, upper_bound)    
        existing_room_ids.append(room_id)
        return room_id

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





    def update_score(self, team):
        if team == "team1":
            self.scoreTeam1 += 1
        elif team == "team2":
            self.scoreTeam2 += 1
        return {"scoreTeam1": self.scoreTeam1, "scoreTeam2": self.scoreTeam2}

    
    def add_client(self, client) -> Optional[Client]:
        if self.playerIn < self.playerTotal:
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
    tournaments = {}

    async def find_room(self, room_id):
        for room in self.rooms:
            if str(room.roomId) == str(room_id):
                return room
        return None

    async def connect(self):
        self.ident= str(uuid.uuid4())
        self.name = None
        self.block_list = set()
        GameConsumer.connected_clients.append(self)
        print(f"Client {self.ident} has connected.")
        await self.accept()

    async def disconnect(self, close_code):
        print(f"Client {self.ident} has disconnected.")
        await self.broadcast_disconnect({"ident": "user_%s" % self.ident, 'cmd' : "disconnect"})
        GameConsumer.connected_clients.remove(self)


    async def create_tournament_lobby(self, name = "Default"):
        tournament_id = Room.generate_room_id(self.existing_room_ids)
        max_players = 4

        print(f"Création du tournoi avec ID: {tournament_id}")
        new_tournament = Tournament(tournament_id, max_players)
        self.tournaments[tournament_id] = new_tournament
        
        # Ajouter le créateur du tournoi comme premier joueur
        new_client = Client(self.ident, 0, self, name)
        new_tournament.add_player(new_client)
        
        # Envoie une confirmation au client
        data = {
            "cmd": "joinLobby",
            "tournamentId": tournament_id,
            "maxPlayers": max_players,
            "players": [{"ident": new_client.ident}],  # Ajoute le joueur créateur
            "host": True  # Le créateur est l'hôte
        }
        await self.send(json.dumps(data))


    async def notify_players_in_lobby(self, room):
        players_in_lobby = [{"ident": client.ident} for client in room.clients]
        data = {
            "cmd": "updateLobbyPlayers",
            "players": players_in_lobby
        }
        for client in room.clients:
            await client.websocket.send(json.dumps(data))


    async def end_match(self, room, winner_client):
        print(f"Match terminé, gagnant : {winner_client.ident}")

        # Le gagnant avance à l'étape suivante
        winner_data = {
            "cmd": "matchWinner",
            "winner": winner_client.ident
        }

        for client in room.clients:
            await client.websocket.send(json.dumps(winner_data))
        
        # Supprimer la room une fois le match terminé
        self.rooms.remove(room)

    async def join_lobby(self, tournament_id):
        """Ajoute un joueur au lobby d'un tournoi."""
        if tournament_id in self.tournaments:
            
            tournament = self.tournaments[tournament_id]
            new_client = Client(self.ident, len(tournament.players), self)
            tournament.add_player(new_client)

            # Mise à jour du frontend
            data = {
                "cmd": "joinLobby",
                "tournamentId": new_room.roomId,
                "maxPlayers": 4,
                "playerIn": new_room.playerIn,
                "host": True,  # Marque ce client comme l'hôte
                "players": [{"ident": client.ident} for client in new_room.clients]  # Inclure les joueurs existants
            }

            await self.send(json.dumps(data))

            # Notifie tous les autres joueurs
            await self.notify_players_in_lobby(tournament_id)


    async def receive(self, text_data):
        if len(text_data) > 0:
            text_data_json = json.loads(text_data)
            text_data_json.update({"ident": "user_%s" % self.ident})
            print(f"Receive data -> { text_data }")
            if not hasattr(self, 'name') or self.name is None:
                name = text_data_json.get('name')
                if name == 'Guest' or not name:
                    self.name = 'Guest' + str(len(self.connected_clients))
                else:
                    self.name = name
                
            cmd = text_data_json.get("cmd")

            if cmd == "getBackendInfo":
                    tournament_ids = list(self.tournaments.keys())
                    if tournament_ids:
                        response = {
                            "cmd": "backendInfo",
                            "tournamentId": tournament_ids,
                            #"maxPlayers": tournament.max_players,
                            "connected_clients": [client.ident for client in self.connected_clients],
                            #"players": [client.ident for client in tournament.players],
                            #"matches": len(tournament.matches),
                        }
                    else:
                        response = {
                            "cmd": "backendInfo",
                            "message": "No tournament found"
                        }
                    await self.send(text_data=json.dumps(response))
            elif cmd == "chat":
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
                await self.createRoom(2, self.name)
            elif cmd == "roomCreate4":
                await self.createRoom(4)
            elif cmd == "createTournamentLobby":
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
        print(f"{data}")
        is_command, error_parsing = await self.parsing_chat(data)

        if error_parsing:
            # Send error message back to the sender
            error_data = {
                "cmd": "badChat",
                "msg": error_parsing
            }
            await self.send(json.dumps(error_data))
        else:
            if is_command:
                # Command was processed successfully, do not broadcast
                pass
            else:
                room_id = data.get('roomId')
                room = None
                if room_id:
                    room = await self.find_room(room_id)

                if room:
                    # Both 'roomId' exists and 'room' is not None
                    for client in room.clients:
                        if client.ident != self.ident:
                            await client.websocket.send(json.dumps(data))
                else:
                    # Either 'roomId' is missing or 'room' is None
                    error_data = {
                        "cmd": "badChat",
                        "msg": "Chat error: You need to be in a room to send a chat message. Otherwise, use commands like /dm, /block, /invite, /profile."
                    }
                await self.send(json.dumps(error_data))

    async def parsing_chat(self, data):
        message = data['data']
        if message.startswith('/'):
            if message.startswith('/dm'):
                error = await self.handle_dm(message, data)
                return (True, error)
            elif message.startswith('/block'):
                error = await self.handle_block(message, data)
                return (True, error)
            elif message.startswith('/invite'):
                error = await self.handle_invite(message, data)
                return (True, error)
            elif message.startswith('/profile'):
                error = await self.handle_profile(message, data)
                return (True, error)
            else:
                return (True, 'Invalid command: not recognized.')
        else:
            return (False, None)  # Not a command, no error


    async def handle_dm(self, message, data):
        parts = message.split(' ', 2)
        if len(parts) < 3:
            return 'Invalid /dm command. Usage: /dm recipient_name message'
        recipient_name = parts[1]
        dm_message = parts[2]
        print(f"Recipient = >{recipient_name }<\n Message= >{dm_message}<")
        recipient_client = await self.find_client_by_name(recipient_name)
        print(f"recipient_client =>{recipient_client}<")
        if recipient_client:
            # Check if the recipient has blocked the sender
            if self.name in recipient_client.block_list:
                return f'Cannot send message to {recipient_name}. You have been blocked by the user.'
            # Check if the sender has blocked the recipient
            if recipient_name in self.block_list:
                return f'Cannot send message to {recipient_name}. You have blocked this user.'
            dm_data = {
                'cmd': 'chat',
                'name': data['name'],
                'data': dm_message,
            }
            await recipient_client.send(json.dumps(dm_data))
            await self.send(json.dumps({'cmd':'chat', 'name':'Server', 'data':'Message sent'}))
            return None  # No error
        else:
            return f'User {recipient_name} not found.'

    async def handle_block(self, message, data):
        parts = message.split(' ', 1)
        if len(parts) < 2:
            return 'Invalid /block command. Usage: /block user_name'
        user_to_toggle = parts[1]
        # Initialize block_list if it doesn't exist
        if not hasattr(self, 'block_list'):
            self.block_list = set()
        if user_to_toggle in self.block_list:
            # User is already blocked; unblock them
            self.block_list.remove(user_to_toggle)
            confirmation_msg = {'info': f'User {user_to_toggle} has been unblocked.'}
        else:
            # User is not blocked; block them
            self.block_list.add(user_to_toggle)
            confirmation_msg = {'info': f'User {user_to_toggle} has been blocked.'}
        # Send confirmation back to the client
        await self.send(json.dumps(confirmation_msg))
        return None  # No error

    async def handle_invite(self, message, data):
        parts = message.split(' ', 1)
        if len(parts) < 2:
            return 'Invalid /invite command. Usage: /invite recipient_name'
        recipient_name = parts[1]
        recipient_client = await self.find_client_by_name(recipient_name)
        if recipient_client:
            # Check if the recipient has blocked the sender
            if self.name in recipient_client.block_list:
                return f'Cannot send invitation to {recipient_name}. You have been blocked by the user.'
            # Check if the sender has blocked the recipient
            if recipient_name in self.block_list:
                return f'Cannot send invitation to {recipient_name}. You have blocked this user.'
            # Get the roomId
            room_id = data.get('roomId')
            print(f"RoomId>{room_id}<")
            if not room_id:
                return 'You are not in a room to invite from.'
            # Verify that the room exists and the sender is in it
            room = await self.find_room(room_id)
            print(f"Room>{room}<")
            if not room or not room.find_client_by_ident(self.ident):
                return 'You are not in the room to invite from'
            # Prepare the invitation message
            invite_message = f"{self.name} invited you to play in room: {room_id}"
            invite_data = {
                'cmd': 'chat',
                'name': self.name,
                'data': invite_message,
            }
            await recipient_client.send(json.dumps(invite_data))
            return None  # No error
        else:
            return f'User {recipient_name} not found.'

    async def handle_profile(self, message, data):
        parts = message.split(' ', 1)
        if len(parts) < 2:
            return 'Invalid /profile command. Usage: /profile username'
        target_username = parts[1]
        # Check if the user exists
        target_client = await self.find_client_by_name(target_username)
        if target_client:
            # Construct the profile URL
            base_url = ''  # Replace with your actual domain
            profile_url = f"{base_url}/profile/{target_username}"
            # Send the profile URL back to the sender
            profile_data = {
                'cmd': 'profile',
                'name': 'Server',
                'data': profile_url
            }
            await self.send(json.dumps(profile_data))
            return None  # No error
        else:
            return f'User {target_username} not found.'

    async def find_client_by_name(self, name):
        for client in self.connected_clients:
            print(f"Client Name = >{client.name}< =? Name = >{name}<")
            if client.name == name:
                return client
        return None

    async def find_client_by_ident(self, ident):
        for client in self.connected_clients:
            if client.ident == ident:
                return client
        return None

    async def find_room_by_client_ident(self, ident):
        for room in self.rooms:
            for client in room.clients:
                if client.ident == ident:
                    return room
        return None
        
    async def broadcast_move(self, data):
        room = await self.find_room(data['roomId'])
        if room is not None:
            for client in room.clients:
                if client.ident != self.ident:
                    await client.websocket.send(json.dumps(data))

    async def broadcast_connect(self, data):
        room = await self.find_room(data['roomId'])
        if room is not None:
            for client in room.clients:
                if client.ident != self.ident:
                    await client.websocket.send(json.dumps(data))

    async def broadcast_disconnect(self, data):
        room = await self.find_room_by_client_ident(self.ident)
        if room is not None:
            for client in room.clients:
                if client.ident != self.ident:
                    await client.websocket.send(json.dumps(data))

    async def broadcast_ball_move(self, data):
        room = await self.find_room(data['roomId'])
        if room is not None:
            for client in room.clients:
                if client.ident != self.ident:
                    await client.websocket.send(json.dumps(data))

    async def createRoom(self, playerTotal, creator):
        print(f"Creating new room of {playerTotal}")
        try:
            new_room = Room(int(playerTotal), self.existing_room_ids)
            self.rooms.append(new_room)
            new_room.add_client(Client(self.ident, 0, self, creator))
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
                new_client = Client(self.ident, found_room.playerIn, self, data['name'])
                found_room.add_client(new_client)
                
                # Envoyer les informations des joueurs existants au nouveau joueur
                existing_players = [{"ident": client.ident, "index": client.index} for client in found_room.clients if client.ident != self.ident]
                await self.send(text_data=json.dumps({
                    "cmd": "existingPlayers",
                    "players": existing_players
                }))
                if (found_room.isLobby):
                    data = {
                        "cmd": "joinLobby",
                        "roomId": found_room.roomId,
                        "playerIn": found_room.playerIn,
                        "playerTotal": found_room.playerTotal,
                        "host": False
                    }
                else:
                    data = {
                        "cmd": "joinRoom", 
                        "roomId": found_room.roomId,
                        "playerIn": found_room.playerIn,
                        "playerTotal": found_room.playerTotal,
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
                    name=name,
                    score=player_data['score'],
                    winner=player_data['winner'],
                    team=player_data['team']
                )
            print(f"Game {game.id} saved successfully with {len(players_data)} players.")
        except Exception as e:
            print(f"Error saving game result: {str(e)}")