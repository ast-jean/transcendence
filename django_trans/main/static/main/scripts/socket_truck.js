import { receiveMove, receiveSync, sendSync, removePlayer, players, Player } from './truck.js';

export var socket;

function setupWebSocket() {
    const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    // const ws_path = `${ws_scheme}://${window.location.host}/ws/truck/`;
    socket = new WebSocket(ws_path);

    socket.onopen = function() {
        console.log('WebSocket connection established');
    };

    socket.onclose = function() {
        console.log('WebSocket connection closed');
        setTimeout(setupWebSocket, 5000); // Try to reconnect after 5 seconds
    };

    socket.onmessage = function(event) {
        // console.log(event.data);
        var data = JSON.parse(event.data);
        // {ident, cmd, data}
        if (data.cmd === "chat") {
            receiveChat(data.ident, data.data);
        }
        if (data.cmd === "move") {
            // console.log("event.data", event.data);
            receiveMove(data.ident, data.movementData);
        }
        if (data.cmd === "sync") {
            console.log("event.data", event.data);
            receiveSync(data.ident, data.movementData);
        }
        if (data.cmd === "connect") {
            // players.push(new Player(data.ident,0,0));
            sendSync();
            receiveConnect(data.ident);
            // players.push(new Player(data.ident,0,0));
        }
        if (data.cmd === "disconnect") {
            removePlayer(data.ident);
            receiveDisconnect(data.ident);
            removePlayer(data.ident);
        }
    };
}


document.addEventListener("DOMContentLoaded", setupWebSocket);