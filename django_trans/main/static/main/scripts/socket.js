import { receiveMove, animate, players, Player } from './game.js';
import { receiveChat, receiveConnect, receiveDisconnect } from './chat.js';

export var socket;

function setupWebSocket() {
    const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const ws_path = `${ws_scheme}://${window.location.host}/ws/pong/`;
    socket = new WebSocket(ws_path);

    socket.onopen = function() {
        console.log('WebSocket connection established');
    };

    socket.onclose = function() {
        console.log('WebSocket connection closed');
        setTimeout(setupWebSocket, 5000); // Try to reconnect after 5 seconds
    };

    socket.onmessage = function(event) {
        console.log(event.data);
        var data = JSON.parse(event.data);
        // {ident, cmd, data}
        if (data.cmd === "chat") {
            receiveChat(data.ident, data.data);
        }
        if (data.cmd === "move") {
            receiveMove(data.ident, data.data);
        }
        if (data.cmd === "connect") {
            receiveConnect(data.ident);
            players.push(new Player(data.ident,0,0));
        }
        if (data.cmd === "disconnect") {
            receiveDisconnect(data.ident);
            removePlayer(data.ident);
        }
    };
}

function removePlayer(playerIdToRemove) {
    players = players.filter(player => player.id !== playerIdToRemove);
}

document.addEventListener("DOMContentLoaded", setupWebSocket);