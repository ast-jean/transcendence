import { updateScoreDisplay } from '../gameplay/score.js'; // Synchronisation des scores via WebSocket
import { players } from '../utils/setter.js';

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


        function changeRoomIdElement(roomId) {
            document.getElementById("roomId").textContent = "Room:" + roomId;
        }
        
        
        socketState.socket.onmessage = function(event) {
            var data = JSON.parse(event.data);
    
            if (data.cmd === "roomNotFound") {
                console.log("In roomNotFound");
                alert("Room not found");
                showLayer2Btns();
            }
            if (data.cmd === "joinRoom") {
                console.log("joined room" + data.roomId);
                changeRoomIdElement(data.roomId);
                room_id = data.roomId;
                checkAllPlayersConnected(data.playerTotal);
            }
            if (data.cmd === "existingPlayers") {
                data.players.forEach(player => {
                    if (!players.find(p => p.id === player.ident)) {
                        players.push(new Player(player.ident, 0, wallLength / 2 - 0.5, 0));  
                    }
                });
                //updatePlayerVisualization();
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
                    players.push(new Player(data.ident, 0, wallLength / 2 - 0.5, 0));
                }
                sendSync();
                receiveConnect(data.ident);
                checkAllPlayersConnected();
            }
            if (data.cmd === "disconnect") {
                removePlayer(data.ident);
                receiveDisconnect(data.ident);
            }
            if (data.cmd === "scoreUpdate") {
                player1Score = data.scoreTeam1;
                player2Score = data.scoreTeam2;
                updateScoreDisplay();
            }

            if (data.cmd === "joinLobby") {
                // Mise à jour du room_id après la création du lobby
                room_id = data.roomId;
                console.log("Tournament lobby created, room ID:", room_id);
        
                // Mise à jour des informations du tournoi avec le room_id reçu
                updateTournamentInfo(room_id, data.playerIn, data.playerTotal);
            }

            if (data.cmd === "updateLobbyPlayers") {
                const playersList = document.getElementById('playersList');
                playersList.innerHTML = "";  // Clear the existing list
                data.players.forEach(player => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `Player: ${player.ident}`;
                    playersList.appendChild(listItem);
                });
            if (data.cmd === "playerJoinedTournament") {
                // Mettre à jour le nombre de joueurs connectés
                const playerCount = data.playerCount;
                const maxPlayers = data.maxPlayers;
                const roomId = data.roomId;
                onPlayerJoinedRoom(roomId, playerCount, maxPlayers);
            }
        };
        };
    });
}

export function sendCmd(cmd, roomId) {
    if (socketState.socket && socketState.isSocketReady) {
        socketState.socket.send(JSON.stringify({ cmd, roomId }));
    } else {
        console.error("WebSocket is not ready. Unable to send command.");
    }
}

export function getRoomId(){
    return room_id;
}

export function receiveSync(id, movementData) {
    // console.log(`receiveSync called with id: ${id}, movementData: ${JSON.stringify(movementData)}`); #debug
    let player = players.find(p => p.id === id);
    if (!player) {
        console.log("Creating new player in receiveSync");
        if (!movementData.x) movementData.x = 0;
        if (!movementData.y) movementData.y = 0;
        player = new Player(id, movementData.x, movementData.y * -1, 0);  // Inverser la position y lors de la réception
        players.push(player);
    } else {
        console.log("Updating player position in receiveSync");
        player.mesh.position.x = movementData.x;
        player.mesh.position.y = movementData.y * -1;  // Inverser la position y lors de la réception
    }
    //updatePlayerVisualization();
}

export function receiveConnect(id) {
    console.log(`Player connected with id: ${id}`);
    // Optionnel: ajouter une vérification pour ne pas dupliquer les joueurs
}

export function receiveMove(id, movementData) {
    // console.log(`receiveMove called with id: ${id}, movementData: ${JSON.stringify(movementData)}`); #debug
    const player = players.find(p => p.id === id);
    if (player) {
        if (movementData.x) player.mesh.position.x += movementData.x;
        if (movementData.y) player.mesh.position.y += movementData.y;
        //updatePlayerVisualization();
    } else {
        console.error(`Player with id ${id} not found in receiveMove`);
    }
}

export function sendSync() {
    if (players.length > 0 && players[0].mesh && socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
        let cmd = "sync";
        let x = players[0].mesh.position.x;
        let y = players[0].mesh.position.y * -1;  // Inverser la position y
        let roomId = getRoomId();
        const movementData = { x, y };
        // console.log(`Sending sync: ${JSON.stringify({ cmd, movementData, roomId })}`); #debug
        socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
    } else {
        console.error("Player 0 or its mesh is undefined, or WebSocket is not open");
    }
}

export function removePlayer(playerIdToRemove) {
    console.log("Removing player");
    let player = players.find(p => p.id === playerIdToRemove);
    removeMeshFromScene(player.mesh, scene);
    players = players.filter(player => player.id !== playerIdToRemove);
    //updatePlayerVisualization();
}

export function checkAllPlayersConnected(maxPlayers) {
    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            if (socketState.isSocketReady && players.length === maxPlayers) {
                clearInterval(checkInterval);
                console.log("All players connected, starting game: >" + maxPlayers + "<");
                startCountdown();
                resolve();
            }
        }, 500); // Vérifie toutes les 500 ms

        // Optionnel : Définir un délai d'attente pour rejeter la promesse si cela prend trop de temps
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Timeout waiting for all players to connect'));
        }, 60000); // Délai d'attente de 30 secondes
    });
}