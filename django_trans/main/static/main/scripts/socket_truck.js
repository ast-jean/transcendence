import { removePlayer, players, Player, TruckSim, setPlayerNumber , playerNumber} from './truck.js';

export var socket;
export let room_id = null;

let state1 = {
    position: { x: 16, y: -24, z: 1.02540224318039 } ,
    quaternion: { w: -0.3, x: 0, y: 0, z: 0.95 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity:  { x: 0, y: 0, z: 0 }
}

let state2 = {
    position:   { x: -16, y: 24, z: 1.0254022431803902 },
    quaternion: { w: -0.95, x: 0, y: 0, z: -0.3},
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity:  { x: 0, y: 0, z: 0 }
}

let state3 = {
    position: { x: -16, y: -24, z: 1.02540224318039 },
    quaternion:  { w: 0.3, x: 0, y: 0, z: 0.95},
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity:  { x: 0, y: 0, z: 0 }
}

let state4 = {
    position: { x: 16, y: 24, z: 1.02540224318039 },
    quaternion: { w: 0.95, x: 0, y: 0, z:-0.3},
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity:  { x: 0, y: 0, z: 0 }
}

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
        console.log("data.cmd " + data.cmd);
        if (data.cmd === "roomNotFound") {
            console.log("In roomNotFound");
            alert("Room not found");
        }
        if (data.cmd === "joinRoom") {
            console.log("joined room " + data.roomId);
            getRoomCreateCmd(data.roomId);
            room_id = data.roomId;
            setPlayerNumber(data.clientId)
            
            sendCmd("resetLocations", data.roomId);
        }
        if (data.cmd === "sync") {
            console.log("event.data", event.data);
            receiveSync(data.index, data.movementData);
        }
        if (data.cmd === "connect") {
            receiveConnect(data.ident);
        }
        if (data.cmd === "disconnect") {
            removePlayer(data.ident);
            receiveDisconnect(data.ident);
        }
        if (data.cmd === 'resetLocations') {
            //sync location -> add non existing players
        }
    };
}

function sendCmd(cmd, roomId) {
    socket.send(JSON.stringify({cmd, roomId}))
}

function getRoomCreateCmd(roomId) {
    document.getElementById("roomId").textContent = "Room:" + roomId;
}

function handleSubmit(event) {
    event.preventDefault(); // Prevents the default form submission
    let input = document.querySelector('input[name="searchRoom"]');
    const roomId = input.value;
    if (!roomId) {
        alert("Please fill in all required fields.");
    } else {
        sendCmd("roomSearch", roomId);
        console.log("Searching for Room #"+ roomId);
    }
}

function receiveConnect(id, movementData) {
	const player = players.find(p => p.id === id);
	if (player) {
		player.updateState(movementData);
	} else {
        TruckSim.addPlayer()
    }
}


function receiveSync(index, movementData) {
	const player = players[index];
	if (player) {
		player.updateState(movementData);
	} else {
        let new_player;
        if (index % 2 === 0){
            new_player = team2.push(this.addPlayer(0, 2, 0, "team2"));
        } else {
            new_player = team1.push(this.addPlayer(0, 2, 0, "team1"));
        }
        new_player.updateState(movementData);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('form').addEventListener('submit', handleSubmit);
    document.getElementById('create-room-2').addEventListener('click', createRoom2);
    document.getElementById('create-room-4').addEventListener('click', createRoom4);
    setupWebSocket();
  });
