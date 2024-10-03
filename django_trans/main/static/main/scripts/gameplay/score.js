import { socketState, getRoomId } from '../websockets/socket_pong.js'; // Pour envoyer les scores au serveur
import { setBallSpeedX, setBallSpeedY, setGameOverState } from '../utils/setter.js';
import { addChat } from '../ui/chat.js';

let player1Score = 0;
let player2Score = 0;
const maxScore = 5;

export function updateScore(player) {
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
    updateScoreDisplay();
    checkEndGame();
    // Envoie les scores au serveur si on est en ligne
    if (socketState.socket && socketState.isSocketReady) {
        let cmd = "score";
        let roomId = getRoomId(); // Probablement undefined pour les tournois, à vérifier
        console.log(roomId);
        let data = { cmd, team, roomId };
        console.log("Envoi des données au serveur:", data);
        socketState.socket.send(JSON.stringify(data));
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

// Fonction pour mettre fin à la partie et afficher des options
export function endGame() {
    // Déclare que le jeu est terminé
    setGameOverState(true);

    // Détermine le gagnant
    const winner = player1Score >= maxScore ? 'Player 1' : 'Player 2';

    // Crée un message pour afficher le gagnant
    addChat("Server:", `${winner} wins!`);

    // Affiche les boutons de fin de jeu (rejouer ou retourner au menu)
    const endGameButtons = document.getElementById('end-game-buttons');
    endGameButtons.style.display = 'block';

    // Bouton pour rejouer la partie
    document.getElementById('replay-btn').addEventListener('click', () => {
        document.getElementById('gameCont').removeChild(endGameMessage);
        endGameButtons.style.display = 'none';
        resetGame();
        // startCountdown();
    });
    // Bouton pour retourner au menu principal
    document.getElementById('menu-btn').addEventListener('click', () => {
        location.reload();
        // document.getElementById('gameCont').removeChild(endGameMessage);
        // endGameButtons.style.display = 'none';
        // showAllButtons();
        // resetGame();
        // controls.enabled = false;
    });
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
    setBallSpeedX(0);
    setBallSpeedY(0);
    setGameOverState(true);
    sphere.position.set(0, 0, 0);
    players.forEach(player => {
        player.mesh.position.set(0, player.ident === 1 ? -wallLength / 2 + 1 : wallLength / 2 - 1, 0);
    });
    updateScoreDisplay();
}