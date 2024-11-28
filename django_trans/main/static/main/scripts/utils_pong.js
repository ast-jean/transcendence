// Vérifier si le tournoi est complet
export function isTournamentFull(players, maxPlayers) {
    return players.length >= maxPlayers;
}

// Envoyer un message à tous les joueurs
export function broadcastToPlayers(players, message) {
    players.forEach(player => {
        player.send(message);
    });
}

// Fonction pour la transition entre les phases
export function transitionToNextPhase(tournament) {
    tournament.nextPhase();
    ////console.log(`Transition vers la phase: ${tournament.phase}`);
}
