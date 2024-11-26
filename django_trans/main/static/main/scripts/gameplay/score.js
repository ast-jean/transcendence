import { socketState, getRoomId, sendCmd, host_ident } from '../websockets/socket_pong.js'; // Pour envoyer les scores au serveur
import { setBallSpeedX, setBallSpeedY, setGameOverState, isGameOver, players, isFourPlayerMode, isLocalMode, tournament } from '../utils/setter.js';
import { addChat } from '../ui/chat.js';
import { controls, deleteBall, scene } from '../pong.js';
import { sphere } from '../gameplay/ball.js';
import { hideBtn, showBtn } from '../ui/ui_updates.js';
import { checkIfHost } from '../utils/utils.js';
import { walls } from './wall.js';
import { room_id } from '../utils/setter.js';
import { goLobby, sendMatchWinner } from '../tournament/tournament.js';

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
    if (isFourPlayerMode) {
        const scoreboard = document.getElementById('scoreboard');
        scoreboard.innerHTML = '';
        players.forEach((player) => {
            let lifes = " ";
            for (let i = 0; i < player.lives; i++) {
                lifes += '❤️';
            }
            scoreboard.innerHTML += player.name + ' : ' + lifes + " | ";
        });
        return ;
    } else {

        player1ScoreElement.innerHTML = player1Score;
        player2ScoreElement.innerHTML = player2Score;
    }
}

export function checkEndGame() {
    if (!isGameOver)
    {
        if (isFourPlayerMode) {
            // Check if one player still has lives and others don't
            let remainingPlayers = players.filter(player => player.lives > 0);
            console.log(remainingPlayers);
            console.log(remainingPlayers.length);
            if (remainingPlayers.length === 1) {
                // Send the last remaining player to endGame
                isGameOver == true;
                endGame(remainingPlayers[0]);
                return; // Stop further checks if game is over
            }
        }
        if (player1Score >= maxScore || player2Score >= maxScore) {
            if (tournament){
                if (player1Score >= maxScore ){
                    if (players[0])
                        sendMatchWinner(players[0].ident, players[0].name, players[0].alias, getRoomId());
                }
                else{
                    if (players[1])
                        sendMatchWinner(players[1].ident,players[1].name, players[1].alias, getRoomId());
                }
                endGame();
            }
            else
            {
                console.log('endGame');
                endGame();
            }
        }
    }
    else
        console.log("Game Over");

}

let once = false;
// Fonction pour mettre fin à la partie et afficher des options
export function endGame(player=null) {
    // Déclare que le jeu est terminé
    //Assure it is called once
    console.log("endgame Call");
    if (isGameOver == false) {
        setGameOverState(true);
        hideBtn('scoreboard');
        // Détermine le gagnant
        let winner;
        if (player) {
            winner = player;
        } else {
            winner = player1Score >= maxScore ? players[0] : players[1];
        }
        if (winner === undefined)
            return;
        if (winner && winner.ident.ident)
            winner = winner.ident;
        if (winner.alias) {
            document.getElementById('winner').innerText = winner.alias + " won!";
            addChat("Server:", `${winner.alias} wins!`);
        } else {
            document.getElementById('winner').innerText = winner.name + " won!";
            addChat("Server:", `${winner.name} wins!`);
        }
        // Crée un message pour afficher le gagnant
        showBtn('end-game-buttons');
        document.getElementById('end-game-buttons').classList.remove('d-flex');
        deleteBall(sphere);
        if(checkIfHost(host_ident) && !once && !isLocalMode) {
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
    player1Score = 0;
    player2Score = 0;
    updateScoreDisplay();

}