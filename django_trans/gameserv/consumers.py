from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json
from typing import List, Optional
import random
from asgiref.sync import sync_to_async
import asyncio

class Client:
    def __init__(self, ident, index, websocket, name, alias = None):
        self.ident = ident
        self.name = name
        self.alias = alias
        self.index = index
        self.websocket = websocket
        self.winner = False
        if index is not None:
            self.team = "team1" if index % 2 == 0 else "team2"
        else:
            self.team = None

    def to_dict(self):
        return {
            'ident': self.ident,
            'index': self.index,
            'name': self.name,
            'alias':self.alias,
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
        self.game_start = False
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

    def find_client_by_ident(self, ident):
        for client in self.clients:
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
    
    def to_dict(self):
        return {
            'ident': self.ident,
            'name': self.name,
            'alias':self.alias,
        }

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
        print("Tournament not found")
        return None

    async def connect(self):
        self.ident = str(uuid.uuid4())
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
                self.rooms.remove(room)
            else:
                # Check if the client name exists in the room's clients
                for client in room.clients[:]:
                    if client.name == self.name:
                        room.clients.remove(client)  # Remove the client from the room
                # remove the room if it becomes empty after removing the client
                if len(room.clients) == 0:
                    self.rooms.remove(room)
        for tourney in self.tournaments[:]:  # Create a shallow copy of the list to avoid modifying it while iterating
            # Check if the tourney has any clients
            if len(tourney.clients) == 0:
                self.tournaments.remove(tourney)
            else:
                # Check if the client name exists in the tourney's clients
                for client in tourney.clients[:]:
                    if client.name == self.name:
                        tourney.clients.remove(client)  # Remove the client from the tourney
                # remove the tourney if it becomes empty after removing the client
                if len(tourney.clients) == 0:
                    self.tournaments.remove(tourney)
        
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
                client = self.find_client_by_ident(player_ident)
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

    async def create_tournament_lobby(self, name = "Host", alias = None):
        from .tournament import Tournament
        lobby_room = Room(4, self.existing_room_ids, True)
        self.rooms.append(lobby_room)
        tournament_id = lobby_room.roomId
        max_players = 4
        # print(f"Création du tournoi avec ID: {tournament_id}")
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
            "players": [{"ident": new_client.ident, "name": new_client.name, "alias":new_client.alias}],  # Ajoute le joueur créateur
            "host": True  # Le créateur est l'hôte
        }
        await self.send(json.dumps(data))
        self.notify_players_in_lobby(new_tournament)


    async def notify_players_in_lobby(self, room):
        print("\033[91m Notifing players")
        players_in_lobby = [{"ident": client.ident, "name":client.name, "alias": client.alias} for client in room.clients]
        data = {
            "cmd": "updateLobbyPlayers",
            "players": players_in_lobby
        }
        for client in room.clients:
            await client.websocket.send(json.dumps(data))


    async def construct_all_players_data(self, tournament, cmd):
        """Construct data for all players in the tournament."""
        # Extract the winners based on their `ident` values in `self.winners`
        winners = [
            client.to_dict() 
            for client in tournament.clients 
            if client.ident in tournament.winners[:2]  # First and second winners
        ]
        
        # The third winner, if available
        tournamentWinner = next(
            (client.to_dict() for client in tournament.clients if client.ident == tournament.winners[2]),
            None
        ) if len(tournament.winners) > 2 else None

        # Construct the all_players data dictionary
        data = {
            "cmd": cmd,
            "tournamentId": tournament.tournament_id,
            "players": [client.to_dict() for client in tournament.clients],  # Convert clients to dictionaries
            "winners": winners,  # First and second winners
            "tournamentWinner": tournamentWinner,  # Third winner
            "host": tournament.clients[0].ident,  # Assuming first client is the host
            "doneRooms": tournament.doneRooms,  # Ensure doneRooms is serializable
        }

        return data

    async def resolve_winners(self, winners):
        import asyncio
        for i in range(len(winners)):
            winner = winners[i]
            if asyncio.iscoroutine(winner):
                print(f"Resolving coroutine at index {i}")
                resolved_value = await winner  # Await the coroutine
                winners[i] = resolved_value    # Replace it in the original list
                print(f"Replaced coroutine with resolved value at index {i}")
            else:
                print(f"Winner at index {i} is already resolved")

    async def end_match(self, tournament_id, room_id, winner_id, winner_name, winner_alias):
        # Trouver la room par l'ID de room
        tournament = await self.find_tournament(tournament_id)
        if room_id not in tournament.doneRooms:
            tournament.add_doneRooms(room_id)
            room = await self.find_room(room_id)
            if room:
                print(f"Le match dans la salle {room_id} est terminé. Le gagnant est {winner_id}")
                
                # Si la room fait partie d'un tournoi, on veut faire avancer au tour suivant
                if tournament:
                    print(f"None Resolved winners[{len(tournament.winners)}: {tournament.winners}")
                    await self.resolve_winners(tournament.winners)
                    print(f"Resolved winners[{len(tournament.winners)}: {tournament.winners}")
                    #Correctly store the winner's ident
                    ident = winner_id
                    # Ajouter le gagnant à la liste des joueurs qualifiés pour le tour suivant
                    if len (tournament.winners) >= 2:
                        await tournament.add_winner(ident)
                    else:
                        await tournament.add_winner(ident)
                    print(f"Joueur {ident} ajouté aux gagnants du tournoi {tournament_id}")
                    # Vérifier si tous les matchs sont terminés pour avancer au prochain tour
                    data = await self.construct_all_players_data(tournament, "reportMatchResult")
                    
                    #for match that match.winner = someone
                    for client in tournament.clients:
                        await client.websocket.send(json.dumps(data))
                    if tournament.all_matches_reported():
                        await tournament.advance_to_next_round()
                else:
                    print(f"Tournoi non trouvé pour l'ID {tournament_id}")
            else:
                print(f"Salle non trouvée : {room_id}")
        else:
                print(f"Already in doneRooms : {room_id}")

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

    async def join_tournament(self, tournament_id, player_id, newPlayer="Unknown"):
        # Find the tournament by ID
        tournament = await self.find_tournament(tournament_id)
        print(f"tournament= {tournament}")
        print(self.tournaments)
        
        if tournament:
            # Check if the player already exists in the tournament
            existing_player = next((client for client in tournament.clients if client.ident == player_id), None)
            
            if existing_player:
                response = {
                    "cmd": "joinTournament",
                    "success": False,
                    "error": "Player already in tournament",
                    "tournamentId": tournament_id
                }
            else:
                # Check if there is space in the tournament
                if len(tournament.clients) < tournament.max_players:
                    # Add a new client
                    new_client = Client(player_id, len(tournament.clients), self, self.name, self.alias)
                    tournament.add_player(new_client)
                    print(f"\033[91m JOIN TOURNAMENT: {tournament_id} \033[0m")
                    
                    await self.broadcast_existingPlayers_Tournament(tournament_id)
                    #enable the start tournament btn
                    if len(tournament.clients) == tournament.max_players:
                        if tournament.clients:
                            first_player_ws = tournament.clients[0].websocket  # Access the WebSocket of the first client
                            if first_player_ws:  # Ensure the WebSocket exists
                                await first_player_ws.send(json.dumps({"cmd": "startTourney"}))
                    response = {
                        "cmd": "joinTournament",
                        "success": True,
                        "tournamentId": tournament_id,
                        "players": [{"id": client.ident, "name": client.name, "alias":client.alias, "index": client.index} for client in tournament.clients]
                    }
                else:
                    response = {
                        "cmd": "joinTournament",
                        "success": False,
                        "error": "Tournament is full",
                        "tournamentId": tournament_id
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
                # print(f"Démarrage du tournoi {tournament_id} avec {len(tournament.clients)} joueurs.\n{tournament.clients[0].to_dict()},{tournament.clients[1].to_dict()}",{tournament.clients[2].to_dict()},{tournament.clients[3].to_dict()})
                tournament.create_matches()  # Crée les matchs
                # Envoie chaque match dans une room dédiée
                for match in tournament.matches:
                    new_room = Room(2, self.existing_room_ids)  # Room de match 1v1
                    self.rooms.append(new_room)
                    print(f"Room créée avec ID {new_room.roomId} et ajoutée à self.rooms")
                    new_room.add_client(match.player1)
                    new_room.add_client(match.player2)
                    print(f"Room créée pour {match.player1.ident} et {match.player2.ident}, Room ID: {new_room.roomId}")

                    data = {
                    "cmd": "startMatch",
                    "roomId": new_room.roomId,
                    "host": new_room.host_ident,
                    "players": [
                        {
                            "ident": match.player1.ident,
                            "name": match.player1.name,
                            "alias": match.player1.alias
                        },
                        {
                            "ident": match.player2.ident,
                            "name": match.player2.name,
                            "alias": match.player2.alias
                        }
                    ]
}
                    await match.player1.websocket.send(json.dumps(data))
                    await match.player2.websocket.send(json.dumps(data))
            else:
                print(f"Pas assez de joueurs pour démarrer le tournoi {tournament_id}.")
        else:
            print(f"Tournoi {tournament_id} non trouvé.")

    async def start_game(self, room_id):
        room = await self.find_room(room_id)
        if room and room.game_start is False:
            for client in room.clients:
                # Check if client has an async websocket.send method
                if hasattr(client, 'websocket') and hasattr(client.websocket, 'send') and callable(client.websocket.send):
                    room.game_start = True
                    await client.websocket.send(json.dumps({"cmd": "startGame"}))
                elif hasattr(client, 'send') and callable(client.send):
                    room.game_start = True
                    await client.send(json.dumps({"cmd": "startGame"}))
                else:
                    print(f"Client {client} does not support sending messages.")
            print(f"Le jeu a démarré pour la room {room_id}")

    async def receive(self, text_data):
        if len(text_data) > 0:
            text_data_json = json.loads(text_data)
            text_data_json.update({"ident": self.ident})
            # print(f"Receive data -> { text_data }")
            if not hasattr(self, 'name') or self.name is None:
                name = text_data_json.get('name')
                if name == 'Guest' or not name:
                    self.name = 'Guest' + str(len(self.connected_clients))
                else:
                    self.name = name
            if not hasattr(self, 'alias') or self.alias is None:
                self.alias = text_data_json.get('alias')
                
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
                tournament_id = text_data_json.get('roomId')
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

            elif cmd == "reportMatchResult":
                room_id = text_data_json.get("roomId")
                winner_id = text_data_json.get("winnerId")
                winner_name = text_data_json.get("winnerName")
                winner_alias = text_data_json.get("winnerAlias")
                tournament_id = text_data_json.get("tournamentId")

                if room_id and winner_id:
                    await self.end_match(tournament_id=tournament_id, room_id=room_id, winner_id=winner_id, winner_name=winner_name, winner_alias=winner_alias)
                else:
                    await self.send(text_data=json.dumps({
                        "cmd": "reportMatchResult",
                        "success": False,
                        "error": "Missing room ID or winner ID."
                    }))
            elif cmd == "startFinal":
                room = await self.find_room(text_data_json["roomId"])
                if room is not None:
                    players_in_lobby = [{"ident": client.ident, "name":client.name, "alias": client.alias} for client in room.clients]
                    data = {
                        "cmd": "startMatch",
                        "roomId": text_data_json["roomId"],
                        "host": room.host_ident,
                        "players": players_in_lobby
                    }
                    #send to players in the room
                    # print(f"Room trouvée avec host_ident: {room.host_ident}")
                    for client in room.clients:
                        await client.send(json.dumps(data))#Client is a GameConsumer
                    else:
                        print(f"Client {self.ident} is not the host and cannot update the score.")
                else:
                    print(f"Aucune room trouvée avec roomId: {text_data_json['roomId']}")
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
            if client.ident != self.ident:
                if hasattr(client, 'websocket') and hasattr(client.websocket, 'send') and callable(client.websocket.send):
                    await client.websocket.send(json.dumps(data))
                elif hasattr(client, 'send') and callable(client.send):
                    await client.send(json.dumps(data))
                else:
                    print(f"Client {client} does not support sending messages.")

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
        recipient_client = await self.find_client_by_name(recipient_name)
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
        confirmation_msg = None
        recipient_client = await self.find_client_by_name(user_to_toggle)
        # Initialize block_list if it doesn't exist
        if not hasattr(self, 'block_list'):
            self.block_list = set()
        if user_to_toggle in self.block_list:
            # User is already blocked; unblock them
            self.block_list.remove(user_to_toggle)
            confirmation_msg = f'User {user_to_toggle} has been unblocked.'
        elif recipient_client in self.connected_clients:
            # User is not blocked; block them
            self.block_list.add(user_to_toggle)
            confirmation_msg = f'User {user_to_toggle} has been blocked.'
        # Send confirmation back to the client
        if confirmation_msg is None:
            confirmation_msg = f'User {user_to_toggle} is not connected'
        await self.send(json.dumps({'cmd':'info', 'name':'Server', 'data':confirmation_msg}))
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
        
    @classmethod
    async def find_client_by_name(self, name):
        for client in self.connected_clients:
            if client.name == name:
                return client
        return None
    
    @classmethod
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
        
    async def find_tourney_by_client_ident(self, ident):
        for tourney in self.tournaments:
            for client in tourney.clients:
                if client.ident == ident:
                    return tourney
        return None

    async def broadcast_move(self, data):
        room = await self.find_room(data['roomId'])
        if room is not None:
            for client in room.clients:
                if client.ident != self.ident:
                    if hasattr(client, 'websocket') and hasattr(client.websocket, 'send') and callable(client.websocket.send):
                        await client.websocket.send(json.dumps(data))
                    elif hasattr(client, 'send') and callable(client.send):
                        await client.send(json.dumps(data))
                    else:
                        print(f"Client {client} does not support sending messages.")


    async def broadcast_existingPlayers_Tournament(self, room_id):
        # Send to every player in the room
        print("\033[91m Broadcast existing Players TOURNAMENT \033[0m")
        
        tourney = await self.find_tournament(room_id)
        
        if tourney is not None:
            # Serialize each client's relevant data
            players_data = [
                {
                    'id': client.ident, 
                    'index': client.index,
                    'name': client.name,
                    'alias': client.alias
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
        tourney = await self.find_tourney_by_client_ident(self.ident)
        if tourney is not None:
            for client in tourney.clients:
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
                    if hasattr(client, 'websocket') and hasattr(client.websocket, 'send') and callable(client.websocket.send):
                        await client.websocket.send(json.dumps(data))
                    elif hasattr(client, 'send') and callable(client.send):
                        await client.send(json.dumps(data))
                    else:
                        print(f"Client {client} does not support sending messages.")

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
                await self.broadcast_connect({'ident': self.ident, 'cmd' : 'connect', 'roomId': found_room.roomId, 'name':self.name, 'alias':self.alias})
                
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
