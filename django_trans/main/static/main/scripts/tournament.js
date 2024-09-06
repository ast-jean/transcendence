export class Tournament {
    constructor(roomId, host, maxPlayers) {
        this.roomId = roomId;
        this.host = host;
        this.players = [];
        this.maxPlayers = maxPlayers;
        this.phase = "lobby";  // Les phases: "lobby", "matches", "semifinals", "final", "finished"
    }

    // Ajouter un joueur au tournoi
    addPlayer(player) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(player);
            console.log(`Joueur ${player.id} ajouté.`);
            return true;
        } else {
            console.error("Le tournoi est complet.");
            return false;
        }
    }

    // Retirer un joueur du tournoi
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        console.log(`Joueur ${playerId} retiré.`);
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
            this.organizeMatches();  // Appeler une fonction pour organiser les matchs
        } else {
            console.error("Le tournoi n'est pas encore complet.");
        }
    }

    // Organiser les matchs de la première phase
    organizeMatches() {
        console.log("Organisation des matchs pour la phase actuelle.");
        // Logique d'organisation des matchs (ex: appariement des joueurs)
        this.broadcastMessage("Les matchs commencent !");
    }

    // Transition vers la prochaine phase
    nextPhase() {
        if (this.phase === "matches") {
            this.phase = "semifinals";
        } else if (this.phase === "semifinals") {
            this.phase = "final";
        } else if (this.phase === "final") {
            this.phase = "finished";
        }
        console.log(`Transition vers la phase: ${this.phase}`);
    }

    // Mettre à jour le score d'un joueur après un match
    updateScore(playerId, score) {
        let player = this.players.find(p => p.id === playerId);
        if (player) {
            player.score = score;
            console.log(`Score de ${player.id} mis à jour: ${score}`);
        }
    }

    // Envoyer un message à tous les joueurs
    broadcastMessage(message) {
        this.players.forEach(player => {
            // Assumes that player has a `send` method for communication
            if (player.send) {
                player.send(message);
            }
        });
    }
}
