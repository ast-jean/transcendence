import { hideBtn, showBtn } from "../ui/ui_updates.js";
import { isTournament, localPlayerId, modal, setIsTournament, setPlayers, setRoomId, tournament, room_id } from "../utils/setter.js";
import { checkIfHost } from "../utils/utils.js";
import { host_ident, setupWebSocket, socketState } from "../websockets/socket_pong.js";

export class Tournament {
    constructor(tournamentId, maxPlayers) {
        this.tournamentId = tournamentId;
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.matches = [];
        this.isLobby = true;
        this.winner = null;
    }

    // Méthode pour ajouter un joueur
    addPlayer(player) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(player);
            console.log(`Joueur ${player.name} ajouté au tournoi`);
        } else {
            console.warn('Le tournoi est plein');
        }
        this.updatePlayerListUI(this.players);
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

    getPlayerIndex(players, winnerIdent) {
        return players.findIndex(player => player.ident === winnerIdent);
    }

    updatePlayerListUI(allPlayers, matchWinners = [], tournamentWinner = null) {
        let colors = ["#F86259", "#00B7FF", "#ffff66","#00ff00"]
        // Update all players
        allPlayers.forEach((player, index) => {
            let playerElement = document.getElementById(`player${index + 1}Element`);
            if (playerElement) {
                playerElement.textContent = player.alias ? player.alias : player.name;
            } else {
                console.error(`Element with id 'player${index + 1}Element' not found`);
            }
        });
    
        // Update match winners
        if (matchWinners.length > 0) {
            matchWinners.forEach((winner, index) => {
                let winnerElement = document.getElementById(`winner${index + 1}Element`);
                let winnerElementBox = document.getElementById(`W${index + 1}-row`);

                if (winnerElement) {
                    let i = this.getPlayerIndex(allPlayers, winner.ident);
                    winnerElement.textContent = winner.alias || winner.name || "pending..";
                    winnerElementBox.style.backgroundColor = colors[i];
                } else {
                    console.error(`Element with id 'winner${index + 1}Element' not found`);
                }
            });
        }
    
        // Update tournament winner
        if (tournamentWinner) {
            document.getElementById("exampleModalLabel").textContent = "BRAVO! Tournament has ended";
            hideBtn('startFinalBtn');
            let tournamentWinnerElement = document.getElementById("tournamentWinnerElement");
            let tournamentWinnerElementBox = document.getElementById("WF-row");
            if (tournamentWinnerElement) {
                if (tournamentWinner){
                    let i = this.getPlayerIndex(allPlayers, tournamentWinner.ident);
                    tournamentWinnerElement.textContent = tournamentWinner.alias || tournamentWinner.name || "pending..";
                    tournamentWinnerElementBox.style.backgroundColor = colors[i];
                }
            } else {
                console.error(`Element with id 'tournamentWinnerElement' not found`);
            }
        }
    }

    setPlayers(playersJson) {
        playersJson.forEach(player => {
            if (this.players.length < this.maxPlayers) {
                this.players.push({
                    id: player.id,
                    name: player.name,
                    alias: player.alias,
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
        if (data.cmd === "updateLobbyPlayers") {
            console.log(data.players);
            this.players = data.players;
            console.log(this.players);
        }
        if (data.success === true) {
            modal.show();
        }
        this.updatePlayerListUI(data.players, data.winners, data.tournamentWinner);
    }

    reportMatchResult(data){
        if (data['doneRooms'].includes(room_id)) {
            console.log("THE ROOM IS DONE");
            modal.show();
        } else {
            console.log("THE ROOM IS NOT DONE!!!!");
        }
        document.getElementById("exampleModalLabel").textContent = "Waiting for next round...";
        this.updatePlayerListUI(data.players, data.winners,  data.tournamentWinner);
        hideBtn('startTournamentBtn');
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
        console.log("room Id set: ", room_id);
        setPlayers(players);
        console.log("players set: ", players);
        setIsTournament(true);
        console.log("set tournament: ", isTournament);
    } else {
        console.error("Le WebSocket n'est pas prêt. Impossible d'envoyer la commande `goLobby`.");
    }
}

export function sendMatchWinner(winnerId, winnerName, winnerAlias, roomId) {
    if (socketState.socket && socketState.isSocketReady) {
        // Construire le message de commande à envoyer au backend
        const data = {
            cmd: "reportMatchResult",
            roomId: roomId,
            winnerId: winnerId,
            winnerName: winnerName,
            winnerAlias: winnerAlias,
            tournamentId: tournament.tournamentId
        };

        // Envoyer la commande via le WebSocket
        socketState.socket.send(JSON.stringify(data));
        console.log(`Signal envoyé au backend : Gagnant du match pour la salle ${roomId} est ${winnerId} du tournoi ${tournament.tournamentId}`);
    } else {
        console.error("WebSocket n'est pas prêt ou vous n'êtes pas l'hôte. Impossible d'envoyer les informations du gagnant.");
    } 
}