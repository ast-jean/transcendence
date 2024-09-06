import {showLayer2Btns, hideLayer2Btns, receiveMove, receiveSync, sendSync, removePlayer, players, Player, startCountdown, wallLength, sphere, setBallSpeedX, setBallSpeedY} from './pong.js';
import { receiveChat, receiveConnect, receiveDisconnect } from './chat.js';
import * as THREE from 'three';


export var room_id;

export const socketState = {
    socket: null,
    isSocketReady: false,
    players_ready: false,
};
export function getRoomId(){
    return room_id;
}
export function setupWebSocket() {
    return new Promise((resolve, reject) => {
        const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
        const ws_path = `${ws_scheme}://${window.location.host}/ws/pong/`;
        socketState.socket = new WebSocket(ws_path);
        console.log("Creating WebSocket:", socketState.socket);

        socketState.socket.onopen = function() {
            console.log('WebSocket connection established');
            socketState.isSocketReady = true;
            resolve();
        };

        socketState.socket.onclose = function() {
            console.log('WebSocket connection closed');
            socketState.isSocketReady = false;
            reject(new Error('WebSocket connection closed'));
        };

        socketState.socket.onerror = function(error) {
            console.error('WebSocket error:', error);
            reject(error);
        };


        function changeRoomIdElement(roomId) {
            document.getElementById("roomId").textContent = "Room:" + roomId;
        }
        
        
        socketState.socket.onmessage = function(event) {
            var data = JSON.parse(event.data);
    
            if (data.cmd === "roomNotFound") {
                console.log("In roomNotFound");
                alert("Room not found");
                showLayer2Btns();
            }
            if (data.cmd === "joinRoom") {
                console.log("joined room" + data.roomId);
                changeRoomIdElement(data.roomId);
                room_id = data.roomId;
                checkAllPlayersConnected(data.playerTotal);
            }
            if (data.cmd === "existingPlayers") {
                data.players.forEach(player => {
                    if (!players.find(p => p.id === player.ident)) {
                        players.push(new Player(player.ident, 0, wallLength / 2 - 0.5, 0));  
                    }
                });
                updatePlayerVisualization();
            }
            if (data.cmd === "chat") {
                receiveChat(data.ident, data.data);
            }
            if (data.cmd === "move") {
                receiveMove(data.ident, data.movementData);
            }
            if (data.cmd === "sync") {
                receiveSync(data.ident, data.movementData);
            }
            if (data.cmd === "ballSync") {
                receiveBallSync(data.ballData);
            }
            if (data.cmd === "connect") {
                if (!players.find(p => p.id === data.ident)) {
                    players.push(new Player(data.ident, 0, wallLength / 2 - 0.5, 0));
                }
                sendSync();
                receiveConnect(data.ident);
                checkAllPlayersConnected();
            }
            if (data.cmd === "disconnect") {
                removePlayer(data.ident);
                receiveDisconnect(data.ident);
            }
            if (data.cmd === "scoreUpdate") {
                player1Score = data.scoreTeam1;
                player2Score = data.scoreTeam2;
                updateScoreDisplay();
            }
        };
    });
}

export function sendCmd(cmd, roomId) {
    socketState.socket.send(JSON.stringify({cmd, roomId}))
}


export function receiveBallSync(ballData) {

    let currentPos = new THREE.Vector2(sphere.position.x, sphere.position.y);
    let serverPos = new THREE.Vector2(ballData.x, ballData.y);
    
    let smoothingFactor = 0.5;
    let interpolatedPos = currentPos.lerp(serverPos, smoothingFactor);
    
    sphere.position.set(interpolatedPos.x, interpolatedPos.y, 0);
    
    
    // Synchroniser les vitesses de la balle également
    setBallSpeedX(ballData.vx)
    setBallSpeedY(ballData.vy)
}


// let player1Score = 0;
// let player2Score = 0;
// const maxScore = 5;

// const player1ScoreElement = document.getElementById('player1Score');
// const player2ScoreElement = document.getElementById('player2Score');

// function updateScoreDisplay() {
//     player1ScoreElement.innerHTML = getScoreHTML(player1Score, '🟢', maxScore);
//     player2ScoreElement.innerHTML = getScoreHTML(player2Score, '🔵', maxScore);
// }

// function getScoreHTML(score, symbol, maxScore) {
//     let scoreHTML = '';
//     for (let i = 0; i < score; i++) {
//         scoreHTML += symbol;
//     }
//     for (let i = score; i < maxScore; i++) {
//         scoreHTML += '⚪';
//     }
//     return scoreHTML;
// }



export function checkAllPlayersConnected(maxPlayers) {
    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            if (socketState.isSocketReady && players.length === maxPlayers) {
                clearInterval(checkInterval);
                console.log("All players connected, starting game: >" + maxPlayers + "<");
                startCountdown();
                resolve();
            }
        }, 500); // Vérifie toutes les 500 ms

        // Optionnel : Définir un délai d'attente pour rejeter la promesse si cela prend trop de temps
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Timeout waiting for all players to connect'));
        }, 60000); // Délai d'attente de 30 secondes
    });
}


document.querySelector('form').addEventListener('submit', handleSubmit);
function handleSubmit(event) {
    event.preventDefault(); // Prevents the default form submission
    let input = document.querySelector('input[name="searchRoom"]');
    const roomId = input.value;
    if (!roomId) {
        event.preventDefault();
        alert("Please fill in all required fields.");
    } else {
        hideLayer2Btns();
        sendCmd("roomSearch", roomId);
        console.log("Searching for Room #"+ roomId);
    }
}
