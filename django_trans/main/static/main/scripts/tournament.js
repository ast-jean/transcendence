export class Tournament {
    constructor(roomId, host, maxPlayers) {
        this.roomId = roomId;
        this.host = host;
        this.players = [];
        this.maxPlayers = maxPlayers;
        this.phase = "lobby";
    }

    // Ajouter un joueur au tournoi
    addPlayer(player) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(player);
            return true;
        }
        return false;
    }

    // Retirer un joueur du tournoi
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
    }

    // Vérifier si le tournoi est complet
    isFull() {
        return this.players.length >= this.maxPlayers;
    }

    // Commencer le tournoi
    startTournament() {
        if (this.isFull()) {
            this.phase = "matches";
            console.log("Le tournoi commence !");
            // Logique pour organiser les premiers matchs ici
        } else {
            console.error("Le tournoi n'est pas encore complet.");
        }
    }

    // Transition vers la prochaine phase (semi-finales, finale)
    nextPhase() {
        if (this.phase === "matches") {
            this.phase = "semifinals";
        } else if (this.phase === "semifinals") {
            this.phase = "final";
        }
        console.log(`Phase actuelle: ${this.phase}`);
    }

    // Mettre à jour le score après un match
    updateScore(playerId, score) {
        let player = this.players.find(p => p.id === playerId);
        if (player) {
            player.score = score;
        }
    }

    // Envoyer un message à tous les joueurs
    broadcastMessage(message) {
        this.players.forEach(player => {
            player.send(message);
        });
    }
}

// Gérer la soumission du formulaire pour rejoindre un tournoi
export function joinTournament(roomId) {
    setupWebSocket().then(() => {
        sendCmd("roomSearch", roomId);
    }).catch(err => {
        console.error("WebSocket connection failed:", err);
    });
}
