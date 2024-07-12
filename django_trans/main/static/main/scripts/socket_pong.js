

import { receiveMove, receiveSync, sendSync, removePlayer, players, Player, startCountdown, wallLength } from './pong.js';
import { receiveChat, receiveConnect, receiveDisconnect } from './chat.js';

export const socketState = {
    socket: null,
    isSocketReady: false,
    players_ready: false
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
            console.log(socketState.isSocketReady);
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
            if (data.cmd === "chat") {
                receiveChat(data.ident, data.data);
            }
            if (data.cmd === "move") {
                receiveMove(data.ident, data.movementData);
            }
            if (data.cmd === "sync") {
                receiveSync(data.ident, data.movementData);
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

export function checkAllPlayersConnected() {
    if (socketState.isSocketReady && players.length == 2) {
        console.log("All players connected, starting game");
        startCountdown();
        
    }
}



// document.addEventListener("DOMContentLoaded", setupWebSocket);






// document.addEventListener("DOMContentLoaded", () => {
//     const playOnlineButton = document.getElementById('onlineplay_btn');
//     if (playOnlineButton) {
//         playOnlineButton.addEventListener('click', setupWebSocket);
//     }
// });

