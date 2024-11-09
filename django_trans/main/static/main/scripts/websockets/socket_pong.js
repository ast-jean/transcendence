import * as THREE from 'three';
import { addPlayerToGame, localPlayerId, players, setID } from '../utils/setter.js';
import { checkIfHost, connectPlayersInRoom, determineIfVertical, getNewPlayerColor, getNewPlayerPosition, getPlayerStartingPosition, isPositionValid, removeMeshFromScene } from '../utils/utils.js';
import { sphere } from '../gameplay/ball.js';
import { setBallSpeedX, setBallSpeedY, removePlayer, removeAllPlayers} from '../utils/setter.js';
import { Player } from '../gameplay/player.js';
import { wallLength } from '../gameplay/wall.js';
import { addChat, addChatProfile } from '../ui/chat.js'
import { startGame_online } from '../pong.js';
import { hideAllButtons, hideBtn, showBtn } from '../ui/ui_updates.js';
import { tournament, setTournament } from '../utils/setter.js';
import { updateTournamentUI } from '../ui/ui_updates.js';
import { scene } from '../pong.js';
import { displayPlayersInScene } from '../gameplay/add_scene.js';
import { setCameraPlayer2 } from '../ui/camera.js';

export var room_id;
export var host_ident;

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

        socketState.socket.onopen = function () {
            console.log('WebSocket connection established');
            socketState.isSocketReady = true;
            sendCmd(null,null);
            addChat("Server:", "You are connected", 'success')
            document.getElementById('chat-btn').disabled = false;
            document.getElementById('chat-input').disabled = false;
            resolve();
        };

        socketState.socket.onclose = function () {
            console.log('WebSocket connection closed');
            socketState.isSocketReady = false;
            addChat("Server:", "you are offline", 'danger');
            document.getElementById('chat-btn').disabled = true;
            document.getElementById('chat-input').disabled = true;
            reject(new Error('WebSocket connection closed'));
        };

        socketState.socket.onerror = function (error) {
            console.error('WebSocket error:', error);
            reject(error);
        };
        
        
        socketState.socket.onmessage = function(event) {
            var data = JSON.parse(event.data);
    
            if (data.cmd === "tournamentWinner") {
                console.log(`Le gagnant du tournoi est : ${data.winnerId}`);
                alert(`The winner of the tournament : ${data.winnerId}`);
            }
            if (data.cmd === "startGame") {
                hideAllButtons();
                hideBtn('start_btn');
                displayPlayersInScene(players, scene);  // Affiche tous les joueurs dans la scène
                console.log("La partie a commencé pour tous les joueurs");
            }
            if (data.cmd === 'playerId') {
                console.log("Player ID reçu du serveur:", data.playerId);
                
                // Sauvegarde l'ID du joueur dans la variable globale
                setID(data.playerId);
                console.log("ID du joueur local sauvegardé:", localPlayerId);
            }
            if (data.cmd === "roomNotFound") {
                addChat('Server:', "Room not found", "danger");
                showBtn('layer2Btns_online');
            }
            if (data.cmd === "joinRoom") {
                console.log(data);
                console.log("joined room" + data.roomId);
                room_id = data.roomId;
                host_ident = data.host; 
                if (checkIfHost(data.host)) {
                    showBtn('start_btn');
                }   
                addChat("Server", "Room id = " + room_id)
                checkAllPlayersConnected(data.playerTotal);
            }
            if (data.cmd === "existingPlayers") {
                addChat("Server", "Player connected");
                receiveExistingPlayers(data);
            }
            if (data.cmd === "updateTournament") {
                tournament.addPlayer(data.player);
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
                // console.log(data.ident, "before move");
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
                addChat(data.name, " has joined");
            }
            if (data.cmd === "disconnect") {
                addChat("Server:", "The other player has disconnected", 'danger');
                removePlayer(data.ident);
                new Promise(resolve => setTimeout(resolve, 5000)); //wait 5 sec
                location.reload();  
            }

            if (data.cmd === "joinLobby") {
                console.log(`Player joined lobby for tournament ${data.tournamentId}`);
                if (data.host === true) {
                    document.getElementById('tournamentRoomLabel').innerHTML = "Room #:" + data.tournamentId;
                    setTournament(data.tournamentId, data.maxPlayers);
                    tournament.updatePlayerListUI();
                    console.log(`Tournament ${data.tournamentId} initialized with max ${data.maxPlayers} players`);
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
                console.log("UPDATE PLAYERS IN LOBBY");
                if (tournament){
                    console.log("Tournament exists");
                    tournament.handleBackendUpdate(data);
                } else {
                    console.log("No tournament set");
                }
            }

            // Event listener pour le début du match
            if (data.cmd === "startMatch") {
                console.log(`Match démarré dans la Room ID ${data.roomId} avec les joueurs : ${data.players.join(", ")}`);
                let index = 0;
                // Pour chaque joueur dans la room, les ajouter à la scène et au tableau global players
                data.players.forEach(playerId => {
                    // Vérifie si le joueur est déjà dans la liste (évite les doublons)
                    if (!players.find(p => p.ident === playerId)) {
                        // Ajoute le joueur à la scène avec une position spécifique
                        // On suppose que tu veux que les joueurs soient placés sur les murs (par exemple, vertical/horizontal)
                        if (checkIfHost(data.host)) {
                            showBtn('start_btn');
                        }
                        const isVertical = determineIfVertical(index);  // Remplace par ta logique pour déterminer le placement du joueur
                        const playerPosition = getPlayerStartingPosition(index); // Logique pour assigner une position spécifique au joueur

                        addPlayerToGame(playerId, playerPosition.x, playerPosition.y, playerPosition.z, 0x00ff00, scene, false, isVertical);
                        console.log(`Player ${playerId} ajouté à la scène à la position (${playerPosition.x}, ${playerPosition.y})`);
                        index++;
                    }
                });
                // Connecte les joueurs entre eux via WebSocket
                room_id = data.roomId;
                //connectPlayersInRoom(data.roomId, data.players);
            }
            if (data.cmd === "joinTournament") {
                if (data.success) {
                    console.log(`Rejoint avec succès le tournoi ID : ${data.tournamentId}`);
                    document.getElementById('tournamentRoomLabel').innerHTML = "Room #:" + data.tournamentId;
                    setTournament(data.tournamentId, 4);
                    tournament.handleBackendUpdate(data);
                    tournament.setPlayers(data['players']);

                    console.log(tournament.tournamentId);
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

export function getImg() {
    var img;
    try {
        const ImgElement = document.getElementById('imgUrl');
        img = ImgElement.textContent || ImgElement.innerText;

        // If img is invalid, set it to the default image
        if (!img || img === 'null' || img === 'None') {
            img = 'default.jpg';
        }
    } catch (error) {
        // If any error occurs, fallback to the default image
        img = 'default.jpg';
    }

    // Prepend the location path with "/avatars/"
    const imgPath = `/avatars/${img}`;
    return imgPath;
}

export function getName() {
    var name;
    try {
        var nameElement = document.getElementById('alias');
        if (!nameElement)
            nameElement = document.getElementById('name');
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
        var img = getImg();
        socketState.socket.send(JSON.stringify({ cmd, roomId, name, img }));
    } else {
        console.error("WebSocket is not ready. Unable to send command.");
    }
}

export function getRoomId() {
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


export function receiveExistingPlayers(data) {
    console.log(data);
    removeAllPlayers(scene);
    data.data.players.forEach((player, index) => {
        const newPosition = getNewPlayerPosition(index);
        const newColor = getNewPlayerColor(index);
        players.push(new Player(player.ident, newPosition.x, newPosition.y, 0, newColor,0, player.name, player.img));
        console.log("Existing player added: ", player.ident);    
        addChat("->", player.name);
    });
}


export function receiveConnect(id) {
    console.log(`Player connected with id: ${id}`);
    // // Vérifier si le joueur existe déjà
    // if (!players.find(p => p.ident === id)) {
    //     // Si aucun joueur n'est dans la liste, c'est le premier joueur à se connecter
    //     if (players.length == 0) {
    //         players.push(new Player(id, 0, wallLength / 2 - 0.5, 0, 0x0000ff));  // Ajout du premier joueur
    //         console.log("new player 1 push");
    //     } else {
    //         // Pour les autres joueurs, calculer une nouvelle position et couleur
    //         const newPosition = getNewPlayerPosition(players.length);
    //         const newColor = getNewPlayerColor(players.length);
    //         players.push(new Player(id, newPosition.x, newPosition.y, 0, newColor));  // Ajout des autres joueurs
    //         console.log(`new player ${players.length + 1} push at position (${newPosition.x}, ${newPosition.y})`);
    //     }
    // }
    // Envoyer la synchronisation du nouveau joueur
    // sendSync();
}

//export function receiveConnect(id) {
//    console.log(`Player connected with id: ${id}`);
//
//    // Ajouter le joueur s'il n'existe pas déjà dans la liste
//    if (players.length == 0)
//        players.push(new Player(id, 0, wallLength / 2 - 0.5, 0, 0x0000ff));
//    if (!players.find(p => p.id === id)) {
//        if (players.length == 0 ){    
//            players.push(new Player(id, 0, wallLength / 2 - 0.5, 0, 0x0000ff));  // Ajout du nouveau joueur
//            console.log("new player 1 push");
//        }
//        else{
//            players.push(new Player(id, 0, wallLength / 2 - 0.5, 0, 0x00ffff));  // Ajout du nouveau joueur
//            console.log("new player 2 push");
//        }
//    }
//    // Envoyer la synchronisation du nouveau joueur
//    sendSync();
//}

// Fonction qui reçoit la nouvelle position du joueur
function receiveMove(playerId, newPosition) {
    const player = players.find(p => p.ident === playerId);
    if (player) {
        // Mettre à jour directement la position du joueur
        player.mesh.position.x = newPosition.newX;
        player.mesh.position.y = newPosition.newY;
        // console.log(`Joueur ${playerId} déplacé à la nouvelle position (${newPosition.x}, ${newPosition.y})`);
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
        var img = getImg();
        socketState.socket.send(JSON.stringify({ cmd, movementData, roomId, name, img }));
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
        hideBtn('startGameButton');
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
                hideBtn('playerCount');
                showBtn('startGameButton');
                if (!checkIfHost(host_ident)) {
                    setCameraPlayer2();
                }
                wait_startmatch();
                resolve();
            }
        }, 500); // Vérifie toutes les 500 ms

        setTimeout(() => {
            clearInterval(checkInterval);
            addChat('Server', 'Connection Timeout for players', 'danger');
            hideBtn('playerCount');
            new Promise(resolve => setTimeout(resolve, 5000)); //wait 5 sec
            location.reload();  
            reject(new Error('Timeout waiting for all players to connect'));
        }, 600000); // Délai d'attente de secondes
    });
}

export function wait_startmatch() {
    return new Promise((resolve, reject) => {
        showBtn('joined');
        hideBtn('joining');
        showBtn('playerCount');
        if (checkIfHost(host_ident)) {
            showBtn('start_btn');
        }
        const timeout = setTimeout(() => {
            reject(new Error('Timeout: No startMatch message received within the expected time.'));
        }, 2400000); 

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