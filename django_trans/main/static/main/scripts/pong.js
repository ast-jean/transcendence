// Import des modules nécessaires
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AIPlayer, initializePlayers, movePlayer, updatePlayerVisualization } from './gameplay/player.js';
import { moveBall, addBallToScene } from './gameplay/ball.js';
import { setupWalls, setWallColor, walls } from './gameplay/wall.js';
import { updateScoreDisplay, resetGame, checkEndGame } from './gameplay/score.js';
import { startCountdown } from './ui/ui_updates.js';
import { setupWebSocket, checkAllPlayersConnected, sendCmd, getRoomId } from './websockets/socket_pong.js';
import { randomizeColors } from './ui/colors.js';
import { showLayer2Btns, hideLayer2Btns, hideAllButtons } from './ui/ui_updates.js';
import { Player } from './gameplay/player.js';
import { players } from './utils/setter.js';

// Variables globales du jeu
var clock = new THREE.Clock();
export var delta;
export let local_game = false;
export let useAIForPlayer2 = false;


// Configuration Three.js
const container = document.getElementById('gameCont');
const width = container.clientWidth;
const height = container.clientWidth * 0.666;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
renderer.setClearColor(0x000001);
container.appendChild(renderer.domElement);

// Configuration des murs
setupWalls(scene);  // Crée les murs dans la scène
setWallColor(0x00ff00);  // Met les murs en vert

// Contrôles de caméra
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, -15, 10);  // Position initiale de la caméra
camera.lookAt(0, 0, 0);           // Assure qu'elle regarde le centre de la scène

// Lumières
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(0, 20, 10);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Démarrage du jeu local
function localPlay() {
    local_game = true;
    hideAllButtons();
    
    // Initialisation des joueurs (local)
    initializePlayers(scene, players); 
    
    // Ajouter la balle à la scène
    addBallToScene(scene);

    // Démarrer le compte à rebours
    startCountdown(); 
}

// Démarrage du jeu contre l'IA
function playAI() {
    initializePlayers(scene, players, true);  // true pour indiquer qu'on joue contre une IA
    addBallToScene(scene);
    //useAIForPlayer2 = true;

    startCountdown(); // Démarrer le compte à rebours
}

// Démarrage du jeu en ligne
async function playOnline(maxPlayers) {
    if (socketState.isSocketReady) {
        sendCmd(`roomCreate${maxPlayers}`);
        try {
            await waitForRoomId();
        } catch {
            location.reload();
        }

        initializePlayers(scene, players);
        //updatePlayerVisualization(players, scene);
        hideLayer2Btns();
        try {
            await checkAllPlayersConnected(maxPlayers);
        } catch (error) {
            console.error("Error waiting for players:", error);
            location.reload();
        }
    }
}

// Animation principale
function animate() {
    requestAnimationFrame(animate);
    delta = clock.getDelta();
    movePlayer(delta, scene);
    moveBall(delta, walls, players);
    controls.update();
    resizeRendererToDisplaySize(renderer);
    renderer.render(scene, camera);
    const player2 = players[1];
    if(player2 instanceof AIPlayer)
    {

        console.log("Updating AI Player...");
        player2.update(delta);
    }
}

// Redimensionnement du canvas
function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}

// Gestion des scores
function updateScore(player) {
    let team = player === 1 ? "team1" : "team2";
    if (player === 1) {
        player1Score++;
    } else if (player === 2) {
        player2Score++;
    }
    updateScoreDisplay(player1Score, player2Score);
    checkEndGame(player1Score, player2Score);
}

// Lancement de l'animation
animate();

// Gestion des événements
document.getElementById('localplay_btn').addEventListener('click', localPlay);
document.getElementById('versusai_btn').addEventListener('click', playAI);
document.getElementById('onlineplay_btn').addEventListener('click', () => showLayer2Btns());
document.getElementById('randomize-colors-btn').addEventListener('click', randomizeColors);
document.getElementById('OneVsOne').addEventListener('click', () => playOnline(2));
document.getElementById('TwoVsTwo').addEventListener('click', () => playOnline(4));

///* Btns layer 1     Btns layer 2
//
//    [ ONLINE ]  --->   [ New 1v1 ]
//    [  LOCAL ]         [ New 2v2 ]
//    [   AI   ]         [ Search  ]
//
//*/
//

//const tournamentButton = document.getElementById('tournament_btn');
//const startTournamentButton = document.getElementById('startTournament');
//const joinTournamentButton = document.getElementById('joinTournament');
//
//if (tournamentButton) {
//    tournamentButton.addEventListener('click', () => {
//        hideAllButtons();
//        showTournamentOptions();
//    });
//}
//
//export function showTournamentOptions() {
//    const tournamentOptions = document.getElementById('tournamentOptions');
//    tournamentOptions.classList.add('active');
//    tournamentOptions.classList.remove('hidden');
//}
//
//export function hideTournamentOptions() {
//    const tournamentOptions = document.getElementById('tournamentOptions');
//    tournamentOptions.classList.remove('active');
//    tournamentOptions.classList.add('hidden');
//}
//
//
//if (startTournamentButton) {
//    startTournamentButton.addEventListener('click', async () => {
//        console.log("Starting tournament lobby");
//
//        hideTournamentOptions();
//
//        hideAllButtons();
//        showLobbyPlayers();
//
//        setupWebSocket().then(() => {
//            console.log("WebSocket ready, sending tournamentLobby command.");
//            sendCmd("tournamentLobby");
//        }).catch(err => {
//            console.error("WebSocket connection failed:", err);
//        });
//    });
//}
//
//if (joinTournamentButton) {
//    joinTournamentButton.addEventListener('click', async () => {
//        console.log("Joining an existing tournament");
//
//        hideTournamentOptions();
//
//        hideAllButtons();
//        showRoomSearch(); 
//    });
//}
//
//function showRoomSearch() {
//    const roomSearchDiv = document.getElementById('tournamentRoomSearch');
//    if (roomSearchDiv) {
//        roomSearchDiv.classList.remove('hidden');
//    }
//}
//
//function hideRoomSearch() {
//    const roomSearchDiv = document.getElementById('tournamentRoomSearch');
//    if (roomSearchDiv) {
//        roomSearchDiv.classList.add('hidden');
//    }
//}
//
//const roomSearchForm = document.getElementById('roomSearchForm');
//if (roomSearchForm) {
//    roomSearchForm.addEventListener('submit', function(event) {
//        event.preventDefault(); 
//
//        const roomIdInput = document.getElementById('roomIdInput');
//        const roomId = roomIdInput.value.trim();
//
//        if (roomId) {
//            hideRoomSearch();
//
//            setupWebSocket().then(() => {
//                sendCmd("roomSearch", roomId);
//            }).catch(err => {
//                console.error("WebSocket connection failed:", err);
//            });
//        } else {
//            alert("Please enter a valid Room ID.");
//        }
//    });
//}
//
//
//function onPlayerJoinedRoom(roomId, playerCount, maxPlayers) {
//    updateTournamentInfo(roomId, playerCount, maxPlayers);
//}
//
//export function updateTournamentInfo(roomId, playerCount, maxPlayers) {
//    const tournamentRoomElement = document.getElementById('tournamentRoom');
//    const connectedPlayersElement = document.getElementById('connectedPlayers');
//
//    if (tournamentRoomElement && connectedPlayersElement) {
//        tournamentRoomElement.innerHTML = `Tournament Room: ${roomId}`;
//        connectedPlayersElement.innerHTML = `Players Connected: ${playerCount}/${maxPlayers}`;
//    } else {
//        console.error("Tournament info elements not found in DOM.");
//    }
//}
//
//function showLobbyPlayers() {
//    const playersList = document.getElementById('playersList');
//    playersList.innerHTML = '<h3>Players in the lobby:</h3>';
//    playersList.style.display = 'block';
//}
//

//

//}
//
//document.getElementById('randomize-colors-btn').addEventListener('click', randomizeColors);
//document.querySelectorAll('.game-button').forEach(button => {
//    if (!button.classList.contains('randomize-colors-btn')) {
//        button.addEventListener('click', hideAllButtons);
//    }
//});
//

//export function movePlayer(delta) {
//    const speed = 20;
//    let x1 = 0;
//    let x2 = 0;
//
//    if (players[0]){        
//        if (keyState['ArrowLeft']) x1 -= speed * delta;
//        if (keyState['ArrowRight']) x1 += speed * delta;
//        
//        if (local_game){
//            if (keyState['KeyA']) x2 -= speed * delta;
//            if (keyState['KeyD']) x2 += speed * delta;
//        }
//        
//        if (x1 !== 0) {
//        let newX = players[0].mesh.position.x + x1;
//        if (newX - players[0].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
//            newX + players[0].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
//                players[0].mesh.position.x = newX;
//                if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
//                    //sendMove
//                    let cmd = "move";
//                    const movementData = { x: x1, y: 0 };
//                    let roomId = getRoomId();
//                    // console.log(movementData, roomId);
//                    socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
//                }
//            }
//            // if (socketState.socket)
//            //     console.log(socketState.socket);
//        }
//        
//        if (x2 !== 0) {
//            let newX = players[1].mesh.position.x + x2;
//            if (newX - players[1].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
//        newX + players[1].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
//            players[1].mesh.position.x = newX;
//            if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
//                let cmd = "move";
//                const movementData = { x: x2 * -1, y: 0 };
//                let roomId = getRoomId();
//                // console.log(movementData, roomId);
//                socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
//            }
//        }
//        // console.log("For X2");
//        if (socketState.socket) {
//            console.log(socketState.socket);
//        } else {
//            console.error("Socket is undefined in movePlayer (X2)");
//        }
//    }
//    
//        updatePlayerVisualization();
//    }
//}
//
//



//// // Function to adjust the camera for the local player
//// function adjustCameraForPlayer(player) {
////     const offsetDistance = 15;  // Distance behind the player
////     const height = 10;  // Height of the camera above the player
//    
////     camera.position.set(player.mesh.position.x, player.mesh.position.y - offsetDistance, height);
////     camera.lookAt(player.mesh.position.x, player.mesh.position.y, 0);
//// }
//




//
//


//

