import { socketState, getRoomId, room_id, sendCmd, host_ident } from '../websockets/socket_pong.js'; // Pour envoyer les scores au serveur
import { setBallSpeedX, setBallSpeedY, setGameOverState, isGameOver, players } from '../utils/setter.js';
import { addChat } from '../ui/chat.js';
import { deleteBall, scene } from '../pong.js';
import { sphere } from '../gameplay/ball.js';
import { hideBtn, showBtn } from '../ui/ui_updates.js';
import { checkIfHost } from '../utils/utils.js';

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
    // Envoie les scores au serveur si on est en ligne
    if (socketState.socket && socketState.isSocketReady && checkIfHost(host_ident) ) {
        let cmd = "score";
        let roomId = getRoomId(); // Probablement undefined pour les tournois, à vérifier
        let data = { cmd, team, roomId };
        socketState.socket.send(JSON.stringify(data));
    }
    checkEndGame();
}

const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');

export function updateScoreDisplay() {
    player1ScoreElement.innerHTML = player1Score;
    player2ScoreElement.innerHTML = player2Score;
    // player1ScoreElement.innerHTML = getScoreHTML(player1Score, '🟢', maxScore);
    // player2ScoreElement.innerHTML = getScoreHTML(player2Score, '🔵', maxScore);
}

export function checkEndGame() {
    if (player1Score >= maxScore || player2Score >= maxScore) {
        endGame();
    }
}
let once = false;
// Fonction pour mettre fin à la partie et afficher des options
export function endGame() {
    // Déclare que le jeu est terminé
    //Assure it is called once
    if (isGameOver == false) {
        setGameOverState(true);
        hideBtn('scoreboard');
        // Détermine le gagnant

        const winner = player1Score >= maxScore ? players[0].name : players[1].name;
        document.getElementById('winner').innerText = winner + " won!";

        // Crée un message pour afficher le gagnant
        addChat("Server:", `${winner} wins!`);
        showBtn('end-game-buttons');
        hideBtn('scoreboard');
        deleteBall(sphere);
        if(checkIfHost(host_ident) && !once) {
            once = true;
            console.log("Send saveGame")
            sendCmd("saveGame", room_id);
        }
    }
}

function getScoreHTML(score, symbol, maxScore) {
    let num = '0'
    let scoreHTML = num;
    for (let i = 0; i < score; i++) {
        scoreHTML += symbol;
    }
    for (let i = score; i < maxScore; i++) {
        scoreHTML = num;
    }
    return scoreHTML;
}

export function resetGame() {
    sphere.position.set(0, 0, 0);
    setBallSpeedX(0);
    setBallSpeedY(0);
  
}