
// première version
// import { receiveMove, receiveSync, sendSync, removePlayer, players, Player, startCountdown, wallLength} from './pong.js';
// import { receiveChat, receiveConnect, receiveDisconnect } from './chat.js';

// export var socket;
// export var isSocketReady = false;

// export function setupWebSocket() {
//     const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
//     const ws_path = `${ws_scheme}://${window.location.host}/ws/pong/`;
//     socket = new WebSocket(ws_path);

//     socket.onopen = function() {
//         console.log('WebSocket connection established');
//         isSocketReady = true;
//     };

//     socket.onclose = function() {
//         console.log('WebSocket connection closed');
//         isSocketReady = false;
//         setTimeout(setupWebSocket, 5000); // Try to reconnect after 5 seconds
//     };

//     socket.onerror = function(error) {
//         console.error('WebSocket error:', error);
//     };

//     socket.onmessage = function(event) {
//         var data = JSON.parse(event.data);
//         console.log(`Message received: ${event.data}`);
//         if (data.cmd === "chat") {
//             receiveChat(data.ident, data.data);
//         }
//         if (data.cmd === "move") {
//             receiveMove(data.ident, data.movementData);
//         }
//         if (data.cmd === "sync") {
//             receiveSync(data.ident, data.movementData);
//         }
//         if (data.cmd === "connect") {
//             if (!players.find(p => p.id === data.ident)) {
//                 players.push(new Player(data.ident, 0, -wallLength / 2 + 0.5, 0));
//             }
//             sendSync();
//             receiveConnect(data.ident);
//             checkAllPlayersConnected();
//         }
//         if (data.cmd === "disconnect") {
//             removePlayer(data.ident);
//             receiveDisconnect(data.ident);
//         }
//     };
// }


// document.addEventListener("DOMContentLoaded", setupWebSocket);


// // deuxième version

import { receiveMove, receiveSync, sendSync, removePlayer, players, Player, startCountdown, wallLength } from './pong.js';
import { receiveChat, receiveConnect, receiveDisconnect } from './chat.js';

export var socket;
export var isSocketReady = false;

export function setupWebSocket() {
    return new Promise((resolve, reject) => {
        const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
        const ws_path = `${ws_scheme}://${window.location.host}/ws/pong/`;
        socket = new WebSocket(ws_path);
        console.log("Creating WebSocket:", socket);

        socket.onopen = function() {
            console.log('WebSocket connection established');
            isSocketReady = true;
            resolve();
        };

        socket.onclose = function() {
            console.log('WebSocket connection closed');
            isSocketReady = false;
            reject(new Error('WebSocket connection closed'));
        };

        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
            reject(error);
        };

        socket.onmessage = function(event) {
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
    if (isSocketReady && players.length >= 2) {
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

