from .consumers import Client, Room, GameConsumer
from typing import List
import json
from asyncio import Lock

class Tournament:
    def __init__(self, tournament_id, max_players):
        self.tournament_id = tournament_id
        self.max_players = max_players
        self.clients: List[GameConsumer] = []
        self.matches = []  # Liste des matchs en cours ou à venir
        self.is_lobby = True  # Etat initial du tournoi, avant le début des matchs
        self.winner = None  # Le gagnant du tournoi une fois terminé
        self.lobby_room = None
        self.winners = []
        self.lock = Lock()
        self.doneRooms = []
    
    def add_player(self, client):
        """Ajoute un joueur au tournoi s'il reste de la place."""
        if len(self.clients) < self.max_players:
            self.clients.append(client)
            return True
        return False

    def remove_player(self, player_id):
        """Supprime un joueur du tournoi par son ID."""
        self.players = [player for player in self.players if player.ident != player_id]

    def get_players(self):
        """Retourne la liste des joueurs actuellement inscrits."""
        return [{"id": player.ident} for player in self.players]
    
    async def add_winner(self, winner_id):
        async with self.lock:
            """Ajoute le gagnant à la liste des gagnants."""
            if winner_id is not None:
                self.winners.append(winner_id)
                print(f"Le joueur {winner_id} a été ajouté à la liste des gagnants.")


    def add_doneRooms(self, room):
        """Ajoute le gagnant à la liste des gagnants."""
        self.doneRooms.append(room)


    def all_matches_reported(self):
        """Vérifie si les deux gagnants sont prêts pour la finale."""
        return len(self.winners) == 2

    def create_matches(self):
        """Crée des matchs en distribuant les joueurs par paires."""
        print(f"Création des matchs pour le tournoi ID {self.tournament_id}...")
        if len(self.clients) == self.max_players:
            self.matches = []
            # Création des paires de joueurs pour les matchs
            for i in range(0, len(self.clients), 2):
                if i + 1 < len(self.clients):
                    match = Match(self.clients[i], self.clients[i + 1])
                    self.matches.append(match)
                    print(f"Match créé entre {self.clients[i].ident} et {self.clients[i + 1].ident}")
                else:
                    print(f"Nombre impair de joueurs, {self.clients[i].ident} reste en attente.")
            print(f"Total de {len(self.matches)} match(s) créé(s).")
        else:
            print(f"Impossible de créer les matchs, pas assez de joueurs : {len(self.clients)} inscrits, {self.max_players} attendus.")
    
    async def report_match_result(self, tournament_id, match_id, winner_ident):
        # Récupère le tournoi
        tournament = next((t for t in self.tournaments if t.tournament_id == tournament_id), None)
        
        if tournament:
            # Récupère le match
            match = next((m for m in tournament.matches if m.id == match_id), None)
            if match:
                winner = next((p for p in [match.player1, match.player2] if p.ident == winner_ident), None)
                if winner:
                    # Déclare le gagnant du match
                    tournament.report_match_result(match, winner)
                    print(f"Match {match_id} terminé. Gagnant: {winner.ident}")

                    # Notifie les joueurs du résultat
                    for player in [match.player1, match.player2]:
                        data = {
                            "cmd": "matchResult",
                            "winner": winner.ident,
                            "matchId": match_id
                        }
                        await player.websocket.send(json.dumps(data))

                    # Vérifie si le tournoi est terminé ou passe à la prochaine étape
                    if tournament.winner:
                        print(f"Tournoi {tournament_id} terminé. Gagnant : {tournament.winner.ident}")
                        for player in tournament.players:
                            await player.websocket.send(json.dumps({
                                "cmd": "tournamentFinished",
                                "winner": tournament.winner.ident
                            }))


    async def advance_to_next_round(self):
            """Crée une nouvelle room pour la finale entre les deux gagnants."""
            if self.all_matches_reported():
                # Créer une nouvelle room pour le match final
                final_room = Room(2, GameConsumer.existing_room_ids)  # Room de match 1v1
                GameConsumer.rooms.append(final_room)
                self.lobby_room = final_room
                # Ajouter les gagnants à la nouvelle room de finale
                # print(f"Winner[0] = {self.winner[0].to_dict()}")
                print(f"self.winner (type: {type(self.winners)}): {self.winner}")
                for client in GameConsumer.connected_clients:
                    if client.ident == self.winners[0]:
                        winner_1 = client
                for client in GameConsumer.connected_clients:
                    if client.ident == self.winners[1]:
                        winner_2 = client
                print(f"The winners are {winner_1},{winner_2}")
                winner_ids = {winner_1.ident, winner_2.ident}
                losers = [client for client in self.clients if client.ident not in winner_ids]
                loser_data = {
                    "cmd": "loserMsg",
                }
                for loser in losers:
                    await loser.websocket.send(json.dumps(loser_data))
                winner_data = {
                    "cmd": "WinMsg",
                }
                winners = [client for client in self.clients if client.ident in winner_ids]
                for winner in winners:
                    await winner.websocket.send(json.dumps(winner_data))
                if winner_1 and winner_2:
                    print("Winner 1 Details:", winner_1.__dict__)
                    print("Winner 2 Details:", winner_2.__dict__)
                    final_room.add_client(winner_1)
                    final_room.add_client(winner_2)
                    print(f"Winner1 and winner2 are true")
                    # Envoi des informations aux deux joueurs concernant la finale
                    data = {
                        "cmd": "PrepFinal",
                        "tournamentId": self.tournament_id,
                        "roomId": final_room.roomId,
                        "players": [
                            {
                                "ident": winner_1.ident,
                                "name": winner_1.name,
                                "alias": winner_1.alias
                            },
                            {
                                "ident": winner_2.ident,
                                "name": winner_2.name,
                                "alias": winner_2.alias
                            }
                        ]
                    }
                    # Envoi des informations via les websockets des deux joueurs
                    for winner in winners:
                        await winner.websocket.send(json.dumps(data))

                    print(f"Match final organisé entre {winner_1.ident} et {winner_2.ident} dans la room {final_room.roomId}.")
                else:
                    print("Erreur : un des gagnants est introuvable.")
            else:
                print("Tous les matchs ne sont pas encore terminés pour avancer au prochain tour.")

class Match:
    def __init__(self, player1, player2):
        self.player1 = player1
        self.player2 = player2
        self.winner = None  # Aucun gagnant tant que le match n'est pas terminé

    def set_winner(self, player):
        """Définit le gagnant du match."""
        if player in [self.player1, self.player2]:
            self.winner = player
