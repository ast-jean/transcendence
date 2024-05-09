import { receiveMove, animate, players } from './game.js';
import { receiveChat, receiveConnect, receiveDisconnect } from './chat.js';
import * as THREE from 'three';

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
        }
        if (data.cmd === "disconnect") {
            receiveDisconnect(data.ident);
        }
    };
}

function removePlayer(playerIdToRemove) {
    players = players.filter(player => player.id !== playerIdToRemove);
}

function updatePlayerPosition(id, x, y) {
    const player = players.find(p => p.id === id);
    if (player) {
        console.log("change player data");
        player.mesh.position.x += x;
        player.mesh.position.y += y;
    } else {
        console.log("create new player");
        players.push(new Player(id, x, y));
    }
}

document.addEventListener("DOMContentLoaded", setupWebSocket);