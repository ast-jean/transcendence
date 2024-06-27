import { receiveMove, receiveSync, sendSync, removePlayer, players, Player } from './truck.js';

export var socket;
export let room_id;

function setupWebSocket() {
    const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const ws_path = `${ws_scheme}://${window.location.host}/ws/truck/`;
    socket = new WebSocket(ws_path);

    socket.onopen = function() {
        console.log('WebSocket connection established');
    };

    socket.onclose = function() {
        console.log('WebSocket connection closed');
        setTimeout(setupWebSocket, 5000); // Try to reconnect after 5 seconds
    };

    socket.onmessage = function(event) {
        console.log("Event.data" + event.data);
        var data = JSON.parse(event.data);
        console.log("data " + data);
        console.log("data.cmd "+data.cmd);
        // {ident, cmd, data}
        if (data.cmd === "chat") {
            receiveChat(data.ident, data.data);
        }
        if (data.cmd === "move") {
            receiveMove(data.ident, data.movementData);
        }
        if (data.cmd === "roomNotFound") {
            console.log("In roomNotFound");
            alert("Room not found");
        }
        if (data.cmd === "sync") {
            console.log("event.data", event.data);
            receiveSync(data.ident, data.movementData);
        }
        if (data.cmd === "connect") {
            sendSync();
            receiveConnect(data.ident);


            console.log("in connect functions");
        }
        if (data.cmd === "disconnect") {
            removePlayer(data.ident);
            receiveDisconnect(data.ident);
            removePlayer(data.ident);
        }
    };
}

export function sendRoomSearch(roomId) {
    let cmd = "roomSearch";
    console.log();
    socket.send(JSON.stringify({ cmd , roomId }));
}

function handleSubmit(event) {
    event.preventDefault(); // Prevents the default form submission
    let input = document.querySelector('input[name="searchRoom"]');
    const roomId = input.value;
    if (!roomId) {
        event.preventDefault(); // Stop form submission
        alert("Please fill in all required fields.");
    } else {
        sendRoomSearch(roomId);
        console.log("Searching for Room #"+ roomId);
    }
}

function createRoom(event)  {
    let cmd = "roomCreate";
    console.log();
    socket.send(JSON.stringify({ cmd }));
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('form').addEventListener('submit', handleSubmit);
    document.getElementById('create-room').addEventListener('click', createRoom);
    setupWebSocket();
  });
