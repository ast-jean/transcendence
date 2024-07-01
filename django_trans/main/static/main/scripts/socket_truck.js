import { receiveMove, removePlayer, players, Player, TruckSim, playerNumber} from './truck.js';

export var socket;
export let room_id = null;

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
        if (data.cmd === "roomNotFound") {
            console.log("In roomNotFound");
            alert("Room not found");
        }
        if (data.cmd === "joinRoom") {
            console.log("joined room" + data.roomId);
            getRoomCreateCmd(data.roomId);
            room_id = data.roomId;
            playerNumber = data.clientId;
            //RESETS the players in the room location with preset location depending on their playerNumber
        }
        if (data.cmd === "sync") {
            console.log("event.data", event.data);
            receiveSync(data.ident, data.movementData);
        }
        if (data.cmd === "connect") {
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

function getRoomCreateCmd(roomId) {
    document.getElementById("roomId").textContent = "Room:" + roomId;
}

function handleSubmit(event) {
    event.preventDefault(); // Prevents the default form submission
    let input = document.querySelector('input[name="searchRoom"]');
    const roomId = input.value;
    if (!roomId) {
        event.preventDefault();
        alert("Please fill in all required fields.");
    } else {
        sendRoomSearch(roomId);
        console.log("Searching for Room #"+ roomId);
    }
}

function createRoom2()  {
    let cmd = "roomCreate2";
    console.log("In room create 2");
    document.querySelectorAll(".menu").forEach(button => {
        button.style.display = 'none';
    });
    socket.send(JSON.stringify({ cmd }));
}

function createRoom4()  {
    let cmd = "roomCreate4";
    document.querySelectorAll(".menu").forEach(button => {
        button.style.display = 'none';
    });
    
    console.log("In room create 4");
    socket.send(JSON.stringify({ cmd }));
}


function receiveConnect(id, movementData) {
	const player = players.find(p => p.id === id);
	if (player) {
		player.updateState(movementData);
	} else {
        TruckSim.addPlayer()
    }
}


function receiveSync(id, movementData) {
	const player = players.find(p => p.id === id);
	if (player) {
		player.updateState(movementData);
	}
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('form').addEventListener('submit', handleSubmit);
    document.getElementById('create-room-2').addEventListener('click', createRoom2);
    document.getElementById('create-room-4').addEventListener('click', createRoom4);
    setupWebSocket();
  });
