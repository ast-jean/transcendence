


export function showTournamentOptions() {
    const tournamentOptions = document.getElementById('tournamentOptions');
    tournamentOptions.classList.add('active');
    tournamentOptions.classList.remove('hidden');
}

export function hideTournamentOptions() {
    const tournamentOptions = document.getElementById('tournamentOptions');
    tournamentOptions.classList.remove('active');
    tournamentOptions.classList.add('hidden');
}

export function showLobbyPlayers() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '<h3>Players in the lobby:</h3>';
    playersList.style.display = 'block';
}

export function showRoomSearch() {
    const roomSearchDiv = document.getElementById('tournamentRoomSearch');
    if (roomSearchDiv) {
        roomSearchDiv.classList.remove('hidden');
    }
}

export function hideRoomSearch() {
    const roomSearchDiv = document.getElementById('tournamentRoomSearch');
    if (roomSearchDiv) {
        roomSearchDiv.classList.add('hidden');
    }
}