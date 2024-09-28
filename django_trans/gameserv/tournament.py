from .consumers import *

class Tournament:
    def __init__(self, tournament_id, max_players):
        self.tournament_id = tournament_id
        self.max_players = max_players
        self.clients: List[Client] = []
        self.matches = []  # Liste des matchs en cours ou à venir
        self.is_lobby = True  # Etat initial du tournoi, avant le début des matchs
        self.winner = None  # Le gagnant du tournoi une fois terminé
    
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
#   
#   async def start_tournament(self, tournament_id):
#       # Récupère le tournoi via son ID
#       tournament = next((t for t in self.tournaments if t.tournament_id == tournament_id), None)
#       
#       if tournament and tournament.start_tournament():
#           print(f"Le tournoi {tournament.tournament_id} commence avec {len(tournament.players)} joueurs.")
#           data = {
#               "cmd": "tournamentStarted",
#               "tournamentId": tournament.tournament_id,
#               "players": [{"id": p.ident} for p in tournament.players]
#           }
#           for player in tournament.players:
#               await player.websocket.send(json.dumps(data))
#
#           # Créer les matchs après le démarrage du tournoi
#           for match in tournament.matches:
#               match_data = {
#                   "cmd": "matchCreated",
#                   "player1": match.player1.ident,
#                   "player2": match.player2.ident
#               }
#               await match.player1.websocket.send(json.dumps(match_data))
#               await match.player2.websocket.send(json.dumps(match_data))
#       else:
#           print(f"Impossible de démarrer le tournoi {tournament_id}.")
#



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


    def advance_to_next_round(self):
        """Passe au tour suivant si le tournoi n'est pas encore terminé."""
        if len(self.matches) == 1:
            self.winner = self.matches[0].winner  # Un seul match, donc un gagnant
        else:
            winners = [m.winner for m in self.matches if m.winner]
            self.players = winners  # Les gagnants deviennent les joueurs du prochain tour
            self.create_matches()  # Crée les nouveaux matchs du tour suivant

class Match:
    def __init__(self, player1, player2):
        self.player1 = player1
        self.player2 = player2
        self.winner = None  # Aucun gagnant tant que le match n'est pas terminé

    def set_winner(self, player):
        """Définit le gagnant du match."""
        if player in [self.player1, self.player2]:
            self.winner = player
