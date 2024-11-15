from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json
from typing import List, Optional
import random
from .tournament import *
from asgiref.sync import sync_to_async

class Client:
    def __init__(self, ident, index, websocket, name, alias = None):
        self.ident = ident
        self.name = name
        self.alias = alias
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
        self.game_over = True
        self.isLobby = is_lobby
        self.game_saved = False

    @staticmethod
    def generate_room_id(existing_room_ids):
        lower_bound = 1000
        upper_bound = 9999
        room_id = random.randint(lower_bound, upper_bound)
        while room_id in existing_room_ids:
            room_id = random.randint(lower_bound, upper_bound)    
        existing_room_ids.append(room_id)
        return room_id

    async def find_client_by_ident(self, ident):
        for client in self.connected_clients:
            if client.ident == ident:
                return client
        return None

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
    tournaments = []
    
    async def find_room(self, room_id):
        for room in self.rooms:
            if str(room.roomId) == str(room_id):
                return room
        print("Room non trouvée")
        return None

    async def find_tournament(self, tournament_id):
        for tourney in self.tournaments:
            if str(tourney.tournament_id) == str(tournament_id):
                return tourney
        print("Room not found")
        return None

    async def connect(self):
        self.ident= str(uuid.uuid4())
        self.name = None
        self.alias = None
        self.block_list = set()
        GameConsumer.connected_clients.append(self)
        print(f"Client {self.ident} has connected.")
        # Renvoie l'ID du joueur au client
        response = {
            "cmd": "playerId",
            "playerId": self.ident
        }
        await self.accept()
        await self.send(text_data=json.dumps(response))

    async def disconnect(self, close_code):
        print(f"Client {self.ident} has disconnected.")
        await self.broadcast_disconnect({"ident": "user_%s" % self.ident, 'cmd' : "disconnect"})
        GameConsumer.connected_clients.remove(self)
        #Delete empty rooms 
        for room in self.rooms[:]:  # Create a shallow copy of the list to avoid modifying it while iterating
            # Check if the room has any clients
            if len(room.clients) == 0: 
                print(f"Room {room['roomId']} is empty and will be removed.")
                self.rooms.remove(room)
            else:
                # Check if the client name exists in the room's clients
                for client in room.clients[:]:
                    if client.name == self.name:
                        room.clients.remove(client)  # Remove the client from the room
                # Optionally, remove the room if it becomes empty after removing the client
                if len(room.clients) == 0:
                    self.rooms.remove(room)
        
    async def go_lobby(self, room_id, players):
        # Trouver la room existante à partir de l'ID de la room
        room = await self.find_room(room_id)
        if room:
            print(f"Déplacement des joueurs vers le lobby pour la salle ID : {room_id}")
            # Si la salle est trouvée, on crée un lobby de tournoi
            #lobby_room = Room(len(players), self.existing_room_ids, is_lobby=True)
            #self.rooms.append(lobby_room)

            lobby_room = room

            # Ajouter les joueurs à la salle de lobby
            for player_ident in players:
                client = await self.find_client_by_ident(player_ident)
                if client:
                    lobby_room.add_client(client)
                    print(f"Client {client.ident} ajouté au lobby.")

            # Informer les clients qu'ils sont dans le lobby
            for client in lobby_room.clients:
                await self.send(json.dumps({
                    "cmd": "joinLobby",
                    "roomId": lobby_room.roomId,
                    "playerIn": lobby_room.playerIn,
                    "playerTotal": lobby_room.playerTotal,
                    "host": lobby_room.host_ident
                }))
        else:
            print(f"Salle ID : {room_id} non trouvée.")
            await self.send(json.dumps({
                "cmd": "roomNotFound",
                "message": f"Room with ID {room_id} not found."
            }))

    async def create_tournament_lobby(self, name = "Default", alias = None):


        lobby_room = Room(4, self.existing_room_ids, True)
        self.rooms.append(lobby_room)
        tournament_id = lobby_room.roomId
        max_players = 4

        
        print(f"Création du tournoi avec ID: {tournament_id}")
        new_tournament = Tournament(tournament_id, max_players)
        self.tournaments.append(new_tournament)
        # Ajouter le créateur du tournoi comme premier joueur
        new_client = Client(self.ident, 0, self, name, alias)
        new_tournament.add_player(new_client)
        
        # Envoie une confirmation au client
        data = {
            "cmd": "joinLobby",
            "tournamentId": tournament_id,
            "maxPlayers": max_players,
            "players": [{"ident": new_client.ident, "name": new_client.name}],  # Ajoute le joueur créateur
            "host": True  # Le créateur est l'hôte
        }
        await self.send(json.dumps(data))
        self.notify_players_in_lobby(new_tournament)


    async def notify_players_in_lobby(self, room):
        print("\033[91m Notifing players")
        players_in_lobby = [{"ident": client.ident, "name":client.name} for client in room.clients]
        data = {
            "cmd": "updateLobbyPlayers",
            "players": players_in_lobby
        }
        for client in room.clients:
            await client.websocket.send(json.dumps(data))


    async def end_match(self, tournament_id, room_id, winner_id):
        tournament = self.tournaments.get(tournament_id)
        
        if tournament:
            # Trouver le match correspondant à cette room
            match = next((m for m in tournament.matches if m.room_id == room_id), None)
            
            if match:
                match.set_winner(winner_id)
                print(f"Match dans la room {room_id} terminé. Gagnant : {winner_id}")

                # Vérifie si tous les matchs de ce tour sont terminés
                if all(m.winner for m in tournament.matches):
                    # Avance au tour suivant ou termine le tournoi
                    await self.advance_to_next_round(tournament_id)
            else:
                print(f"Match introuvable pour la room {room_id}")
        else:
            print(f"Tournoi {tournament_id} introuvable.")

    async def advance_to_next_round(self, tournament_id):
        tournament = self.tournaments.get(tournament_id)

        if tournament:
            winners = [match.winner for match in tournament.matches if match.winner]

            if len(winners) == 1:
                # S'il ne reste qu'un seul gagnant, le tournoi est terminé
                tournament.winner = winners[0]
                await self.declare_winner(tournament_id)
            else:
                # Sinon, on crée de nouveaux matchs pour le prochain tour
                tournament.create_matches(winners)
                print(f"Tour suivant pour le tournoi {tournament_id} avec {len(winners)} joueurs.")
                
                # Envoyer les nouveaux matchs aux joueurs
                for match in tournament.matches:
                    #room_id = Room.generate_room_id(self.existing_room_ids)
                    new_room = Room(2, self.existing_room_ids)
                    self.rooms.append(new_room)
                    
                    new_room.add_client(match.player1)
                    new_room.add_client(match.player2)

                    # Informer les joueurs de leur nouveau match
                    data = {
                        "cmd": "startMatch",
                        "roomId": new_room.roomId,
                        "players": [match.player1.ident, match.player2.ident]
                    }
                    await match.player1.websocket.send(json.dumps(data))
                    await match.player2.websocket.send(json.dumps(data))
        else:
            print(f"Tournoi {tournament_id} non trouvé.")

    async def declare_winner(self, tournament_id):
        tournament = self.tournaments.get(tournament_id)
        
        if tournament and tournament.winner:
            print(f"Le tournoi {tournament_id} est terminé. Gagnant : {tournament.winner.ident}")

            # Informer tous les participants du gagnant
            data = {
                "cmd": "tournamentWinner",
                "tournamentId": tournament_id,
                "winnerId": tournament.winner.ident
            }
            
            for client in tournament.clients:
                await client.websocket.send(json.dumps(data))

    async def join_tournament(self, tournament_id, player_id, newPlayer="Default"):
        # Find the tournament by ID in the list of tournaments
        # tournament = next((t for t in self.tournaments if t.tournament_id == tournament_id), None)
        tournament = await self.find_tournament(tournament_id)
        print(f"tournament= {tournament}")
        print(self.tournaments)
        
        if tournament:
            if len(tournament.clients) < tournament.max_players:
                # Add a new client
                new_client = Client(player_id, len(tournament.clients), self, newPlayer)
                tournament.add_player(new_client)
                print(f"\033[91m JOIN TOURNAMENT: {tournament_id} \033[0m")
                
                await self.broadcast_existingPlayers_Tournament(tournament_id)
                
                response = {
                    "cmd": "joinTournament",
                    "success": True,
                    "tournamentId": tournament_id,
                    "players": [{"id": client.ident, "name":client.name, "index": client.index} for client in tournament.clients]
                }
            else:
                response = {
                    "cmd": "joinTournament",
                    "success": False,
                    "error": "Tournament is full"
                }
        else:
            response = {
                "cmd": "joinTournament",
                "success": False,
                "error": "Tournament not found"
            }
        
        await self.send(text_data=json.dumps(response))


    async def start_tournament(self, tournament_id):
        """Méthode pour démarrer le tournoi et distribuer les joueurs dans des rooms."""
        tournament = next((t for t in self.tournaments if t.tournament_id == tournament_id), None)
        if tournament:
            if len(tournament.clients) == tournament.max_players:
                print(f"Démarrage du tournoi {tournament_id} avec {len(tournament.clients)} joueurs.")
                tournament.create_matches()  # Crée les matchs
                # Envoie chaque match dans une room dédiée
                for match in tournament.matches:
                    new_room = Room(2, self.existing_room_ids)  # Room de match 1v1
                    self.rooms.append(new_room)
                    print(f"Room créée avec ID {new_room.roomId} et ajoutée à self.rooms")
                    new_room.add_client(match.player1)
                    new_room.add_client(match.player2)
                    print(f"Room créée pour {match.player1.ident} et {match.player2.ident}, Room ID: {new_room.roomId}")

                    # Envoi des infos aux joueurs
                    data = {
                        "cmd": "startMatch",
                        "roomId": new_room.roomId,
                        "host": new_room.host_ident,
                        "players": [match.player1.ident, match.player2.ident]
                    }
                    await match.player1.websocket.send(json.dumps(data))
                    await match.player2.websocket.send(json.dumps(data))
            else:
                print(f"Pas assez de joueurs pour démarrer le tournoi {tournament_id}.")
        else:
            print(f"Tournoi {tournament_id} non trouvé.")

    async def start_game(self, room_id):
        room = await self.find_room(room_id)
        if room:
            for client in room.clients:
                await client.websocket.send(json.dumps({"cmd": "startGame"}))
            print(f"Le jeu a démarré pour la room {room_id}")


    async def receive(self, text_data):
        if len(text_data) > 0:
            text_data_json = json.loads(text_data)
            text_data_json.update({"ident": self.ident})
            print(f"Receive data -> { text_data }")
            if not hasattr(self, 'name') or self.name is None:
                name = text_data_json.get('name')
                if name == 'Guest' or not name:
                    self.name = 'Guest' + str(len(self.connected_clients))
                else:
                    self.name = name
            if not hasattr(self, 'alias') or self.alias is None:
                name = text_data_json.get('alias')
                
            cmd = text_data_json.get("cmd")

            if cmd == "getBackendInfo":
                # Extraire les `tournament_id` à partir de la liste des tournois
                tournament_ids = [tournament.tournament_id for tournament in self.tournaments]

                if tournament_ids:
                    response = {
                        "cmd": "backendInfo",
                        "tournamentIds": tournament_ids,  # Correction de la clé pour refléter une liste d'identifiants
                        "connected_clients": [client.ident for client in self.connected_clients],
                    }
                else:
                    response = {
                        "cmd": "backendInfo",
                        "message": "No tournament found"
                    }

                # Envoi de la réponse au client
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
                await self.broadcast_ball_move(text_data_json)
            elif cmd == "roomSearch":
                await self.searchRoom(text_data_json)
            elif cmd == "roomCreate2":
                await self.createRoom(2, self.name, self.alias, text_data_json)
            elif cmd == "roomCreate4":
                await self.createRoom(4)
            elif cmd == "createTournamentLobby":
                await self.create_tournament_lobby(self.name, self.alias) 
            elif cmd == "joinTournament":
                tournament_id = text_data_json.get('tournamentId')
                name = text_data_json.get('name')
                player_id = self.ident  # Utiliser l'identifiant du client actuel
                if tournament_id:
                    await self.join_tournament(tournament_id, player_id, name)
                else:
                    # Gérer les erreurs s'il manque des informations
                    await self.send(json.dumps({
                        "cmd": "joinTournament",
                        "success": False,
                        "error": "Tournament ID manquant."
                    }))
            elif cmd == "startTournament":
                tournament_id = text_data_json.get("tournamentId")
                if tournament_id:
                    await self.start_tournament(tournament_id)
                else:
                    print("Aucun ID de tournoi fourni pour démarrer.")
            elif cmd == "startGame":
                await self.start_game(text_data_json["roomId"])
            elif cmd == "saveGame":
                await self.save_game(text_data_json["roomId"])
            elif cmd == "goLobby":
                room_id = text_data_json.get('roomId')
                players = text_data_json.get('players', [])
                if room_id and players:
                    await self.go_lobby(room_id, players)
                else:
                    await self.send(json.dumps({
                        "cmd": "goLobby",
                        "success": False,
                        "error": "Missing room ID or players list."
                    }))
            elif cmd == "score":
                room = await self.find_room(text_data_json["roomId"])
                # print('ScoreChange')
                # print(self.rooms)
                if room is not None:
                    # print(f"Room trouvée avec host_ident: {room.host_ident}")
                    if self.ident == room.host_ident:
                        score_data = room.update_score(text_data_json["team"])
                        await self.broadcast_score_update(room, score_data)
                    else:
                        print(f"Client {self.ident} is not the host and cannot update the score.")
                else:
                    print(f"Aucune room trouvée avec roomId: {text_data_json['roomId']}")


    async def broadcast_score_update(self, room, score_data):
        data = {
            "cmd": "scoreUpdate",
            "scoreTeam1": score_data["scoreTeam1"],
            "scoreTeam2": score_data["scoreTeam2"]
        }
        for client in room.clients:
            await client.websocket.send(json.dumps(data))

    # async def broadcast_ball_sync(self, data):
    #     for client in self.connected_clients:
    #         if client.ident != self.ident:
    #             await client.send(json.dumps(data))

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
        from main.models import CustomUser
        # from main.urls import CustomUser
        parts = message.split(' ', 1)
        if len(parts) < 2:
            return 'Invalid /profile command. Usage: /profile username'
        target_username = parts[1]
        # Check if the user exists
        # target_client = await self.find_client_by_name(target_username) #searches GameConsumers
        target_user = await sync_to_async(CustomUser.objects.filter(username=target_username).first)()#Searches Users
        if target_user:
            # Construct the profile URL
            profile_url = f"/profile/{target_username}"
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


    async def broadcast_existingPlayers_Tournament(self, room_id):
        # Send to every player in the room
        print("\033[91m Broadcast existing Players TOURNAMENT \033[0m")
        
        tourney = await self.find_tournament(room_id)
        
        if tourney is not None:
            # Serialize each client's relevant data
            players_data = [
                {
                    'id': client.ident,  # Assuming 'ident' is a unique identifier
                    'index': client.index,  # Assuming 'index' is a player's index in the tournament
                    'name': client.name  # Assuming 'name' is a player's name
                }
                for client in tourney.clients
            ]

            data = {
                'cmd': 'updateLobbyPlayers',
                'players': players_data  # Send as a list, no need for json.dumps here
            }
            for client in tourney.clients:
                await client.websocket.send(json.dumps(data))  # Serialize the entire message here
            
    async def broadcast_existingPlayers(self, data):
        #Send to every players in room
        room_id = data.get('data', {}).get('roomId')
        room = await self.find_room(room_id)
        if room is not None:
            for client in room.clients:
                await client.websocket.send(json.dumps(data))

    async def broadcast_disconnect(self, data):
        room = await self.find_room_by_client_ident(self.ident)
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


    async def broadcast_ball_move(self, data):
        room_id = data.get('roomId')
        room = await self.find_room(room_id)
        if room is not None:
            for client in room.clients:
                if client.ident != self.ident:
                    await client.websocket.send(json.dumps(data))

    async def createRoom(self, playerTotal, creator,alias, data):
        print(f"Creating new room of {playerTotal}")
        try:
            new_room = Room(int(playerTotal), self.existing_room_ids)
            self.rooms.append(new_room)
            new_room.add_client(Client(self.ident, 0, self, creator,alias))
            data = {
                "cmd": "joinRoom",
                "roomId": new_room.roomId,
                "playerIn": new_room.playerIn,
                "playerTotal": new_room.playerTotal,
                "clientId": 0,
                "host": new_room.host_ident
            }
            await self.send(json.dumps(data))
        except Exception as e:
            print(f"Error creating room: {str(e)}")

    async def searchRoom(self, data):
        try:
            room_id = data['roomId']
            found_room = await self.find_room(room_id)
            if found_room is None:
                print(f"Room not found: {room_id}")
                raise Exception(f"\033[31mRoom {room_id} not found.\033[0m]")
            else:
                new_client = Client(self.ident, found_room.playerIn, self, data['name'], data['alias'])
                found_room.add_client(new_client)
                existing_players = [
                    {
                        "ident": client.ident, 
                        "index": client.index, 
                        "name": client.name,
                        "alias": client.alias
                    } 
                    for client in found_room.clients
                ]
                data = {
                    "players": existing_players,
                    "roomId": found_room.roomId
                }
                await self.broadcast_existingPlayers({ "cmd": "existingPlayers", 'data': data})
                await self.broadcast_connect({'ident': self.ident, 'cmd' : 'connect', 'roomId':found_room.roomId, 'name':self.name, 'alias':self.alias})
                
                if (found_room.isLobby):
                    data = {
                        "cmd": "joinLobby",
                        "roomId": found_room.roomId,
                        "playerIn": found_room.playerIn,
                        "playerTotal": found_room.playerTotal,
                        "host":  found_room.host_ident
                    }
                    self.notify_players_in_lobby(found_room)
                else:
                    data = {
                        "cmd": "joinRoom", 
                        "roomId": found_room.roomId,
                        "playerIn": found_room.playerIn,
                        "playerTotal": found_room.playerTotal,
                        'clientId': new_client.index,
                        "host" : found_room.host_ident
                    }
                await self.send(json.dumps(data))
        except Exception as e:
            error_message = str(e) 
            print(f"\033[91mError {error_message}\033[0m")
            await self.send(json.dumps({'cmd':'roomNotFound', 'error':error_message}))

            

# Exemple de donnees dans data
# {
#     "cmd": "endGame",
#     "gameId": 1,
#     "players": [
#         {"username": "player1", "score": 10, "winner": True, "team": 1},
#         {"username": "player2", "score": 5, "winner": False, "team": 2}
#     ]
# }

    async def save_game(self, roomId):
        room = await self.find_room(roomId)
        if not room:
            print(f"Room with ID {roomId} not found.")
            return
        if room.game_saved is True:
            print(f"Room with ID {roomId} already saved.")
        
        players_data = []

        # Determine the winning team (no draw)
        if room.scoreTeam1 > room.scoreTeam2:
            winning_team = 1
        else:
            winning_team = 2

        for index, client in enumerate(room.clients):
            expected_team = 1 if index % 2 == 0 else 2 #team1 
            score = room.scoreTeam1 if expected_team == 1 else room.scoreTeam2
            is_winner = expected_team == winning_team
            # Create player info dictionary
            player_info = {
                'username': client.name,
                'score': score,
                'winner': is_winner,
                'team': expected_team
            }
            players_data.append(player_info)
        print('Saving Game')
        # Save the game result
        room.game_saved = True
        await self.save_game_result(players_data)

        
    
    async def save_game_result(self, players_data):
        from main.models import Game, Player  # Import moved inside the function
        from django.contrib.auth import get_user_model
        from asgiref.sync import sync_to_async
        CustomUser = get_user_model()
        try:
            # Create a new game instance
            game = await sync_to_async(Game.objects.create)()
            # Iterate over the player data and create Player instances
            for player_data in players_data:
                try:
                    # Attempt to retrieve the user by username
                    user = await sync_to_async(CustomUser.objects.get)(username=player_data['username'])
                except CustomUser.DoesNotExist:
                    # If user not found, assign to Guest user
                    try:
                        user = await sync_to_async(CustomUser.objects.get)(username='Guest')
                    except CustomUser.DoesNotExist:
                        # Handle case where Guest user does not exist
                        print("Error: 'Guest' user does not exist in the database.")
                        continue  # Skip creating this player
                
                
                await sync_to_async(Player.objects.create)(
                    user=user,
                    game=game,
                    score=player_data['score'],
                    winner=player_data['winner'],
                    team=player_data['team']
                )
            print(f"Game {game.id} saved successfully with {len(players_data)} players.")
        except Exception as e:
            print(f"Error saving game result: {str(e)}")