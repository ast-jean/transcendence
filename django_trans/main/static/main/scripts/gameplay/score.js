import { socketState, getRoomId } from '../websockets/socket_pong.js'; // Pour envoyer les scores au serveur
import { updateScoreDisplay } from './uiUpdates.js'; // Mise à jour de l'affichage du score


let player1Score = 0;
let player2Score = 0;
const maxScore = 5;

function updateScore(player) {
    let team = player === 1 ? "team1" : "team2";

    if (player === 1) {
        if (player1Score < maxScore) {
            player1Score++;
        }
    } else if (player === 2) {
        if (player2Score < maxScore) {
            player2Score++;
        }
    }

    updateScoreDisplay();  // Met à jour l'affichage des scores
    checkEndGame();        // Vérifie si la partie doit se terminer

    // Envoie les scores au serveur si on est en ligne
    if (socketState.socket && socketState.isSocketReady) {
        let cmd = "score";
        let roomId = getRoomId();
        socketState.socket.send(JSON.stringify({ cmd, team, roomId }));
    }
}

const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');

function updateScoreDisplay() {
    player1ScoreElement.innerHTML = getScoreHTML(player1Score, '🟢', maxScore);
    player2ScoreElement.innerHTML = getScoreHTML(player2Score, '🔵', maxScore);
}

function getScoreHTML(score, symbol, maxScore) {
    let scoreHTML = '';
    for (let i = 0; i < score; i++) {
        scoreHTML += symbol;
    }
    for (let i = score; i < maxScore; i++) {
        scoreHTML += '⚪';
    }
    return scoreHTML;
}