

import { receiveMove, receiveSync, sendSync, removePlayer, players, Player, startCountdown, wallLength, sphere } from './pong.js';
import { receiveChat, receiveConnect, receiveDisconnect } from './chat.js';

export var room_id;

export const socketState = {
    socket: null,
    isSocketReady: false,
    players_ready: false,
};

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


        
        
        socketState.socket.onmessage = function(event) {
            var data = JSON.parse(event.data);
            console.log(`Message received: ${event.data}`);
    
            if (data.cmd === "roomNotFound") {
                console.log("In roomNotFound");
                alert("Room not found");
            }
            if (data.cmd === "joinRoom") {
                console.log("joined room" + data.roomId);
                room_id = data.roomId;
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
                    players.push(new Player(data.ident, 0, -wallLength / 2 + 0.5, 0));
                }
                sendSync();
                receiveConnect(data.ident);
                checkAllPlayersConnected();
            }
            if (data.cmd === "disconnect") {
                removePlayer(data.ident);
                receiveDisconnect(data.ident);
            }
        };
    });
}

function createRoom2()  {
    let cmd = "roomCreate2";
    console.log("In room create 2");
    document.querySelectorAll(".menu").forEach(button => {
        button.style.display = 'none';
    });
    sendCmd(cmd, 0);    
}

function createRoom4()  {
    let cmd = "roomCreate4";
    document.querySelectorAll(".menu").forEach(button => {
        button.style.display = 'none';
    });
    sendCmd(cmd, 0);
}

function sendCmd(cmd, roomId) {
    socket.send(JSON.stringify({cmd, roomId}))
}

export function receiveBallSync(ballData) {
    sphere.position.set(ballData.x, ballData.y, 0);
    ballSpeedX = ballData.vx;
    ballSpeedY = ballData.vy;
}


export function checkAllPlayersConnected() {
    if (socketState.isSocketReady && players.length == 2) {
        console.log("All players connected, starting game");
        startCountdown();
        
    }
}

function handleSubmit(event) {
    event.preventDefault(); // Prevents the default form submission
    let input = document.querySelector('input[name="searchRoom"]');
    const roomId = input.value;
    if (!roomId) {
        event.preventDefault();
        alert("Please fill in all required fields.");
    } else {
        sendCmd("roomSearch", roomId);
        console.log("Searching for Room #"+ roomId);
    }
}


// document.addEventListener("DOMContentLoaded", setupWebSocket);






// document.addEventListener("DOMContentLoaded", () => {
//     const playOnlineButton = document.getElementById('onlineplay_btn');
//     if (playOnlineButton) {
//         playOnlineButton.addEventListener('click', setupWebSocket);
//     }
// });

