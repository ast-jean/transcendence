import { updatePlayerVisualization, animate, players } from './game.js';
import { receiveChat } from './chat.js';
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
        var data = JSON.parse(event.data);
        console.log(data.cmd);

        // separate json 
        // {ident, cmd, data}

        //cmd = chat

        if (data.cmd === "chat") {
            console.log("TRUE");
            receiveChat(data.ident, data.data);
        }
        //cmd = move

        //cmd = connect
        //cmd = disconnect


        // console.log('Message from server ', event.data);
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