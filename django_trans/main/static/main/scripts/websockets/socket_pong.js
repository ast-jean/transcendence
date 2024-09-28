import * as THREE from 'three';
import { addPlayerToGame, players } from '../utils/setter.js';
import { removeMeshFromScene } from '../utils/utils.js';
import { sphere } from '../gameplay/ball.js';
import { setBallSpeedX, setBallSpeedY, removePlayer } from '../utils/setter.js';
import { Player } from '../gameplay/player.js';
import { wallLength } from '../gameplay/wall.js';
import { hideChat, showChat, addChat, addChatProfile } from '../ui/chat.js'
import { initTournament } from '../pong.js';
import { hideBtn, showBtn, showLayer2Btns } from '../ui/ui_updates.js';
import { Tournament } from '../tournament/tournament.js';
import { tournament, setTournament } from '../utils/setter.js';
import { updateTournamentUI } from '../ui/ui_updates.js';

export var room_id;

export const socketState = {
    socket: null,
    isSocketReady: false,
    players_ready: false,
};

export function setupWebSocket() {
    return new Promise((resolve, reject) => {
        // const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
        const ws_path = `wss://${window.location.host}/ws/pong/`;
        socketState.socket = new WebSocket(ws_path);
        console.log("Creating WebSocket:", socketState.socket);

        socketState.socket.onopen = function() {
            console.log('WebSocket connection established');
            socketState.isSocketReady = true;
            sendCmd(null,null);
            addChat("Server:", "You are connected", 'success')
            document.getElementById('chat-btn').disabled = false;
            document.getElementById('chat-input').disabled = false;
            resolve();
        };

        socketState.socket.onclose = function() {
            console.log('WebSocket connection closed');
            socketState.isSocketReady = false;
            addChat("Server:", "you are offline", 'danger');
            document.getElementById('chat-btn').disabled = true;
            document.getElementById('chat-input').disabled = true;
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
                addChat('Server:', "Room not found","danger");
                showBtn('layer2Btns_online');
            }
            if (data.cmd === "joinRoom") {
                console.log("joined room" + data.roomId);
                changeRoomIdElement(data.roomId);
                room_id = data.roomId;
                addChat("Server", "Room id = "+ room_id)
                checkAllPlayersConnected(data.playerTotal);
            }
            if (data.cmd === "existingPlayers") {
                addChat("Server", "Player connected")
                data.players.forEach(player => {
                    if (!players.find(p => p.id === player.ident)) {
                        addPlayerToGame(player.ident, 0, wallLength / 2 - 0.5, 0, 0x00ff00)
                        console.log("Existing player added: ", player.ident);    
                        addChat("->", player.name)
                    }
                    });
            }
            if (data.cmd === "updateTournament") {
                tournament.addPlayer(data.player);
            } else if (data.cmd === "startMatch") {
                //tournament.createMatches();
                console.log("Début des matchs");
            } else if (data.cmd === "reportMatchResult") {
                tournament.reportMatchResult(data.matchId, data.winner);
            }
            if (data.cmd === "chat") {
                // parsingChat(data);
                addChat(data.name, ": " + data.data, 'primary')
                //receiving error if bad command
            }
            if (data.cmd === "profile") {
                // parsingChat(data);
                addChatProfile(data.name, data.data, 'primary')
                //receiving error if bad command
            }
            if (data.cmd === "badChat") {
                // parsingChat(data);
                console.log(data);
                addChat('Server', ": " + data.msg, 'warning')
                //receiving error if bad command
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
                receiveConnect(data.ident);
                addChat(data.name, " has joined")
            }
            if (data.cmd === "disconnect") {
                addChat(data.name, " has disconnected")
                removePlayer(data.ident);
            }

            if (data.cmd === "joinLobby") {
                console.log(`Player joined lobby for tournament ${data.tournamentId}`);
                if (data.host === true ){
                    setTournament(data.tournamentId, data.maxPlayers)
                    console.log(`Tournament ${data.tournamentId} initialized with max ${data.maxPlayers} players`)
                }
                
                // Vérifie si data.players est défini et est bien un tableau
                if (Array.isArray(data.players)) {
                    data.players.forEach(player => {
                        tournament.addPlayer(player);
                    });
                } else {
                    console.log("Aucun joueur trouvé dans le lobby.");
                }
            }
            
            if (data.cmd === "updateLobbyPlayers") {
                tournament.handleBackendUpdate(data);
            }

            if (data.cmd === "startMatch") {
                console.log(`Match démarré dans la Room ID ${data.roomId} avec les joueurs : ${data.players.join(", ")}`);
                // Logique pour gérer l'affichage ou l'entrée dans la room
            }
        
            if (data.cmd === "joinTournament") {
                if (data.success) {
                    console.log(`Rejoint avec succès le tournoi ID : ${data.tournamentId}`);
                    // Mise à jour de l'interface utilisateur
                    updateTournamentUI(data.tournamentId, data.players);
                } else {
                    console.error("Impossible de rejoindre le tournoi :", data.error);
                    alert(data.error);
                }
            }
            if (data.cmd === "backendInfo") {
                console.log("%c--- Backend Information ---", "color: #ff00ff; font-weight: bold;");
                console.log("Data received from backend:", data);

                // console.log(`Connected Clients: ${data.connected_clients.length}`);
                console.log(`TournamentIds: ${data.tournamentId}`)
                // data.connected_clients.forEach((client, index) => {
                    // console.log(`Client ${index + 1} - ID: ${client}`);
                // });
        
                //console.log("%cRooms Info:", "color: #ff00ff; font-weight: bold;");
                //data.rooms.forEach((room, index) => {
                //    console.log(`Room ${index + 1} - Room ID: ${room.roomId}, Players: ${room.players.join(", ")}`);
                //    console.log(`Score Team 1: ${room.scoreTeam1}, Score Team 2: ${room.scoreTeam2}`);
                //});
                console.log("%c--------------------------", "color: #ff00ff; font-weight: bold;");
            }
        };
    });
}

export function disconnectWebSocket() {
    if (socketState.socket && socketState.isSocketReady) {
        socketState.socket.close();
        console.log('WebSocket connection closed by disconnectWebSocket function');
        socketState.isSocketReady = false;
    } else {
        console.log('No active WebSocket connection to close');
    }
}

export function getName(){
    var name; 
    try {
        var nameElement = document.getElementById('name'); 
        name = nameElement.textContent || nameElement.innerText;
        if (!name || name === 'null' || name == 'None')
            name = 'Guest';
    } 
    catch {
        name = "Guest";
    }
    return name;
    
}


export function sendCmd(cmd, roomId) {
    if (socketState.socket && socketState.isSocketReady) {
        var name = getName();
        socketState.socket.send(JSON.stringify({ cmd, roomId, name }));
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
        player = new Player(id, movementData.x, movementData.y, 0, 0x0000ff);
        players.push(player);
    } else {
        console.log("Updating player position in receiveSync");
        player.mesh.position.x = movementData.x;
        player.mesh.position.y = movementData.y;
    }
}

export function receiveConnect(id) {
    console.log(`Player connected with id: ${id}`);

    // Ajouter le joueur s'il n'existe pas déjà dans la liste
    if (players.length == 0)
        players.push(new Player(id, 0, wallLength / 2 - 0.5, 0, 0x0000ff));
    if (!players.find(p => p.id === id)) {
        if (players.length == 0 ){    
            players.push(new Player(id, 0, wallLength / 2 - 0.5, 0, 0x0000ff));  // Ajout du nouveau joueur
            console.log("new player 1 push");
        }
        else{
            players.push(new Player(id, 0, wallLength / 2 - 0.5, 0, 0x00ffff));  // Ajout du nouveau joueur
            console.log("new player 2 push");
        }
    }
    // Envoyer la synchronisation du nouveau joueur
    sendSync();
}

export function receiveMove(id, movementData) {
    // console.log(`receiveMove called with id: ${id}, movementData: ${JSON.stringify(movementData)}`); #debug
    const player = players.find(p => p.ident === id);
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
        let y = players[0].mesh.position.y;  // Inverser la position y
        let roomId = getRoomId();
        const movementData = { x, y };
        // console.log(`Sending sync: ${JSON.stringify({ cmd, movementData, roomId })}`); #debug
        var name = getName();
        socketState.socket.send(JSON.stringify({ cmd, movementData, roomId, name }));
    } else {
        console.error("Player 0 or its mesh is undefined, or WebSocket is not open");
    }
}


export function checkAllPlayersConnected(maxPlayers) {
    return new Promise((resolve, reject) => {
        let playerIn = document.getElementById("playerIn");
        let timeElapse = document.getElementById('timeElapse');
        let startTime = Date.now();
        showBtn('playerCount');
        const checkInterval = setInterval(() => {
            // Calculate elapsed time
            let elapsedTime = Date.now() - startTime;
            let totalSeconds = Math.floor(elapsedTime / 1000);
            let minutes = Math.floor(totalSeconds / 60);
            let seconds = totalSeconds % 60;
            
            // Format time according to your requirements
            let formattedTime = '';
            if (minutes > 0) {
                formattedTime = `${minutes}min`;
                if (seconds > 0) {
                    formattedTime += ` ${seconds}sec`;
                }
            } else {
                formattedTime = `${seconds}sec`;
            }
            timeElapse.textContent = formattedTime;
            playerIn.textContent = players.length + "/" + maxPlayers;

            if (socketState.isSocketReady && players.length === maxPlayers) {
                clearInterval(checkInterval);
                console.log("All players connected, starting game: >" + maxPlayers + "<");
                resolve();
            }
        }, 500); // Vérifie toutes les 500 ms

        // Optionnel : Définir un délai d'attente pour rejeter la promesse si cela prend trop de temps
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Timeout waiting for all players to connect'));
            addChat('Server','Connection Timeout for players','danger');
            hideBtn('playerCount');
        }, 600000); // Délai d'attente de secondes
    });
}

export function receiveBallSync(ballData) {

    let currentPos = new THREE.Vector2(sphere.position.x, sphere.position.y);
    let serverPos = new THREE.Vector2(ballData.x, ballData.y);
    
    let smoothingFactor = 0.5;
    let interpolatedPos = currentPos.lerp(serverPos, smoothingFactor);
    
    sphere.position.set(interpolatedPos.x, interpolatedPos.y, 0);
    
    
    // Synchroniser les vitesses de la balle également
    setBallSpeedX(ballData.vx)
    setBallSpeedY(ballData.vy)
}