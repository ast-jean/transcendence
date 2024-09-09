import { socketState, getRoomId } from '../websockets/socket_pong.js'; // Pour envoyer les scores au serveur


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

export function updateScoreDisplay() {
    player1ScoreElement.innerHTML = getScoreHTML(player1Score, '🟢', maxScore);
    player2ScoreElement.innerHTML = getScoreHTML(player2Score, '🔵', maxScore);
}


export function checkEndGame() {
    if (player1Score >= maxScore || player2Score >= maxScore) {
        endGame();
    }
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

export function resetGame() {
    player1Score = 0;
    player2Score = 0;
    ballSpeedX = 0;
    ballSpeedY = 0;
    //isGameOver = true;
    sphere.position.set(0, 0, 0);
    players.forEach(player => {
        player.mesh.position.set(0, player.id === 1 ? -wallLength / 2 + 1 : wallLength / 2 - 1, 0);
    });
    updateScoreDisplay();
}