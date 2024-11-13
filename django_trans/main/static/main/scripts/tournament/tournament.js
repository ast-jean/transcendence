import { modal, setIsTournament, setPlayers, setRoomId } from "../utils/setter.js";
import { setupWebSocket, socketState } from "../websockets/socket_pong.js";

export class Tournament {
    constructor(tournamentId, maxPlayers) {
        this.tournamentId = tournamentId;
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.matches = [];
        this.isLobby = true;
        this.winner = null;
        //this.modal = new bootstrap.Modal(document.getElementById('exampleModal'));
    }

    // Méthode pour ajouter un joueur
    addPlayer(player) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(player);
            console.log(`Joueur ${player.name} ajouté au tournoi`);
        } else {
            console.warn('Le tournoi est plein');
        }
        this.updatePlayerListUI();
    }

    // Méthode pour initialiser les matchs
    createMatches() {
        console.log('Création des matchs');
        this.matches = [];
        for (let i = 0; i < this.players.length; i += 2) {
            let match = new Match(this.players[i], this.players[i + 1]);
            this.matches.push(match);
        }
    }

    // Méthode pour gérer les résultats de match
    reportMatchResult(matchId, winner) {
        let match = this.matches.find(m => m.id === matchId);
        if (match) {
            match.setWinner(winner);
            console.log(`Match ${matchId} terminé. Gagnant: ${winner.id}`);
        }

        // Logique pour gérer la fin des matchs ou avancer au prochain tour
        if (this.allMatchesCompleted()) {
            this.advanceToNextRound();
        }
    }

    // Méthode pour vérifier si tous les matchs sont terminés
    allMatchesCompleted() {
        return this.matches.every(match => match.winner !== null);
    }

    // Méthode pour avancer au tour suivant
    advanceToNextRound() {
        const winners = this.matches.map(match => match.winner);
        if (winners.length === 1) {
            this.winner = winners[0];
            console.log(`Tournoi terminé ! Le gagnant est ${this.winner.id}`);
        } else {
            this.players = winners;
            this.createMatches();
        }
    }

    // updatePlayerListUI() {
    //     const playersList = document.getElementById('playersList');
    //     playersList.innerHTML = '';
    //     tournament.players.forEach(player => {
    //         let li = document.createElement('li');
    //         li.textContent = `Joueur: ${player.id}`;
    //         playersList.appendChild(li);
    //     });
    // }

    updatePlayerListUI() {
        console.log(this.players);
        this.players.forEach((player, index) => {
            let playerElement = document.getElementById(`player${index + 1}Element`);   
            if (playerElement) {
                // Update the playerElement as needed
                playerElement.textContent = player.name; // Example update
            } else {
                console.error(`Element with id 'player${index + 1}Element' not found`);
            }
        });
    }

    setPlayers(playersJson) {
        playersJson.forEach(player => {
            if (this.players.length < this.maxPlayers) {
                this.players.push({
                    id: player.id,
                    name: player.name,
                    index: player.index
                });
            } else {
                console.log(`Cannot add ${player.name}: Tournament is full.`);
            }
        });
    
        console.log(`${this.players.length} players added to the tournament.`);
        console.log(this.players); 
    }

    // Recevoir les données du backend et mettre à jour la liste des joueurs
    handleBackendUpdate(data) {
        console.log(data);
        if (data.cmd === "updateLobbyPlayers") {
            console.log(data.players);
            this.players = data.players;
            console.log(this.players);
        }
        this.updatePlayerListUI();
    }
}

// Classe Match pour gérer les matchs individuels
class Match {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.winner = null;
    }

    // Définir le gagnant
    setWinner(winner) {
        if (winner === this.player1 || winner === this.player2) {
            this.winner = winner;
        } else {
            console.error('Joueur non valide');
        }
    }
}



// Fonction pour créer un tournoi (demande envoyée au backend)
export async function createTournamentLobby(tournamentId, maxPlayers) {
    try {
        await setupWebSocket();
        console.log("WebSocket prêt.");
    } catch (error) {
        console.error("Erreur lors de l'établissement du WebSocket :", error);
        return;
    }
    const cmd = {
        cmd: "createTournamentLobby",
        tournamentId: tournamentId,
        maxPlayers: maxPlayers
    };
    socketState.socket.send(JSON.stringify(cmd));
}


function addPlayerToTournament() {
    // Fonction pour ajouter le joueur courant au tournoi
    const player = { id: socketState.socket.id, websocket: socketState.socket };
    if (!players.find(p => p.ident === player.ident)) {
        players.push(player);
        console.log(`%c[Debug] Joueur ajouté: ID ${player.ident}`, "color: #00ff00;");
    } else {
        console.warn(`%c[Debug] Joueur déjà présent: ID ${player.ident}`, "color: #ffff00;");
    }
}

export function goLobby(players, room_id) {
    if (socketState.socket && socketState.isSocketReady) {
        const cmd = "goLobby";

        let data = {
            cmd: cmd,
            roomId: room_id,
            players: players.map(player => player.ident)
        };

        socketState.socket.send(JSON.stringify(data));
        console.log(`Signal envoyé au backend pour déplacer les joueurs dans le lobby pour la salle ID : ${room_id}`);

        setRoomId(room_id);
        setPlayers(players);
        setIsTournament(true);
    } else {
        console.error("Le WebSocket n'est pas prêt. Impossible d'envoyer la commande `goLobby`.");
    }
}
