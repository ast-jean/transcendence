import { setupWebSocket, sendCmd } from '../websockets/socket_pong.js'; // Pour les actions liées aux tournois
import { updateTournamentInfo } from './ui_updates.js'; // Pour mettre à jour l'affichage du tournoi


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

function showLobbyPlayers() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '<h3>Players in the lobby:</h3>';
    playersList.style.display = 'block';
}

function showRoomSearch() {
    const roomSearchDiv = document.getElementById('tournamentRoomSearch');
    if (roomSearchDiv) {
        roomSearchDiv.classList.remove('hidden');
    }
}

function hideRoomSearch() {
    const roomSearchDiv = document.getElementById('tournamentRoomSearch');
    if (roomSearchDiv) {
        roomSearchDiv.classList.add('hidden');
    }
}