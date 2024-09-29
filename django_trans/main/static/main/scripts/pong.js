// Import des modules nécessaires
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AIPlayer, initializePlayers, initializePlayers4, movePlayer } from './gameplay/player.js';
import { moveBall, addBallToScene } from './gameplay/ball.js';
import { setupWalls, setWallColor, walls } from './gameplay/wall.js';
import { checkAllPlayersConnected, getRoomId, sendCmd, socketState, setupWebSocket, disconnectWebSocket, room_id } from './websockets/socket_pong.js';
import { randomizeColors } from './ui/colors.js';
import { hideAllButtons, hideBtn, showBtn } from './ui/ui_updates.js';
import { players, setPlayerMode } from './utils/setter.js';

import { displayPlayersInScene } from './gameplay/add_scene.js';
import { addChat, showChat } from './ui/chat.js';
import { setCameraPlayer1, setCameraPlayer2, setCameraTopView } from './ui/camera.js';
import { Tournament, createTournamentLobby } from './tournament/tournament.js';
import { tournament } from './utils/setter.js';
import { displayDebugInfo } from './utils/utils.js';
import { showTournamentOptions } from './ui/ui_tournament.js';

// Variables globales du jeu
var clock = new THREE.Clock();
export var delta;
export let local_game = false;
export let useAIForPlayer2 = false;

// Configuration Three.js
const container = document.getElementById('gameCont');
const width = container.clientWidth;
const height = container.clientWidth * 0.666;
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
renderer.setClearColor(0x000001);
container.appendChild(renderer.domElement);

// Configuration des murs
setupWalls(scene);
setWallColor(808080);


// Contrôles de caméra
export const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, -15, 10);  // Position initiale de la caméra
camera.lookAt(0, 0, 0);           // Assure qu'elle regarde le centre de la scène

// Lumières
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(0, 20, 10);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);


function localPlay4Players() {
    console.log("Initialisation du mode Local Play à 4 joueurs");
    initializePlayers4()
    setPlayerMode(true);

}

// Démarrage du jeu local
function localPlay() {
    local_game = true;
    // hideAllButtons();
    console.log("local play");
    initializePlayers(scene, false, false);
}

// Démarrage du jeu contre l'IA
function playAI() {
    initializePlayers(scene, true, false);  // true pour indiquer qu'on joue contre une IA
}

async function playOnline(maxPlayers) {

    // Si le WebSocket est prêt, continuer avec la création de la room
    if (socketState.isSocketReady) {
        console.log(`Création de la room pour ${maxPlayers} joueurs.`);
        sendCmd(`roomCreate${maxPlayers}`);
        try {
            // Attend la confirmation de la création de la room (par exemple, room ID)
            await waitForRoomId();
            console.log("Room créée avec succès.");
        } catch {
            console.error("Échec de la récupération de l'ID de la room.");
            location.reload();  // Recharge la page en cas d'échec
            return;
        }

        // Initialise les joueurs après avoir rejoint une room
        initializePlayers(scene, false, true);
        // ();  // Cache les boutons après la configuration
        hideBtn('layer2Btns_online');
        hideBtn('layer2Btns_tournament');
        try {
            // Vérifie que tous les joueurs sont connectés avant de commencer la partie
            await checkAllPlayersConnected(maxPlayers);
            console.log("Tous les joueurs sont connectés.");
        } catch (error) {
            console.error("Erreur lors de la connexion des joueurs :", error);
            location.reload();  // Recharge la page si un problème survient
            return;
        }

        // Démarre le compte à rebours après la connexion des joueurs
        // startCountdown();
    } else {
        addChat("Server:", "not connected", "danger");
        console.error("Le WebSocket n'est pas prêt.");
    }
}



export function initTournament(tournamentId, maxPlayers) {
    tournament = new Tournament(tournamentId, maxPlayers);
    console.log(`Tournament ${tournamentId} initialized with max ${maxPlayers} players`);
}

// Function to wait until room_id changes from null
function waitForRoomId() {
    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            if (getRoomId() !== null) {
                clearInterval(checkInterval);
                resolve(getRoomId());
            }
        }, 100); // Check every 100 milliseconds

        // Optional: Set a timeout to reject the promise if it takes too long
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error("Timed out waiting for room_id to change from null"));
        }, 10000); // 10 seconds timeout
    });
}

// Animation principale
function animate() {
    requestAnimationFrame(animate);
    delta = clock.getDelta();
    movePlayer(delta, scene);
    moveBall(delta, walls, players);
    //controls.update();
    resizeRendererToDisplaySize(renderer);
    renderer.render(scene, camera);
    const player2 = players[1];
    if (player2 instanceof AIPlayer) {
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

// // Gestion des scores
// function updateScore(player) {
//     let team = player === 1 ? "team1" : "team2";
//     if (player === 1) {
//         player1Score++;
//     } else if (player === 2) {
//         player2Score++;
//     }
//     updateScoreDisplay(player1Score, player2Score);
//     checkEndGame(player1Score, player2Score);
// }

// Lancement de l'animation
animate();

// Fonction de gestion du submit
function handleSubmit(event) {
    event.preventDefault(); // Prevent the default form submission
    console.log('handleSubmit called'); // Vérifie si la fonction est appelée

    let input = document.querySelector('input[name="searchRoom"]');
    const roomId = input.value;
    console.log('Room ID:', roomId); // Vérifie la valeur du champ
    hideBtn('layer2Btns_online');
    hideBtn('layer2Btns_tournament');
    if (!roomId) {
        alert("Please fill in all required fields.");
    } else {
        sendCmd("roomSearch", roomId);
        console.log("Searching for Room #" + roomId);
    }
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'i') {
        displayDebugInfo();
    }
});

function joinTournament(tournamentId) {
    // Vérifier si le WebSocket est prêt
    if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
        const cmd = {
            cmd: "joinTournament",
            tournamentId: tournamentId
        };
        socketState.socket.send(JSON.stringify(cmd));
        console.log("Requête envoyée pour rejoindre le tournoi :", tournamentId);
    } else {
        console.error("WebSocket n'est pas prêt.");
        alert("Connexion WebSocket non établie.");
    }
}

const tournamentOptions = document.getElementById('tournamentOptions');

// Gestionnaire d'événements pour le bouton Créer un tournoi
document.getElementById('createTournamentBtn').addEventListener('click', async () => {
    console.log("Création d'un nouveau tournoi");

    // Envoyer la commande au serveur pour créer un tournoi
    const cmd = {
        cmd: "createTournamentLobby",
    };
    try {
        await setupWebSocket();
        console.log("WebSocket prêt.");
        socketState.socket.send(JSON.stringify(cmd));
        console.log(`Commande envoyée pour créer le tournoi`);
    } catch (error) {
        console.error("Erreur lors de l'établissement du WebSocket :", error);
        return;
    }


});

// Gestionnaire d'événements pour le bouton Rejoindre un tournoi
document.getElementById('joinTournamentBtn').addEventListener('click', async () => {
    console.log("Rejoindre un tournoi existant");
    try {
        await setupWebSocket();
        console.log("WebSocket prêt.");
        //socketState.socket.send(JSON.stringify(cmd));
        document.getElementById('tournamentJoinForm').classList.remove('hidden');
        // Logique pour rejoindre un tournoi ici...
    } catch (error) {
        console.error("Erreur lors de l'établissement du WebSocket :", error);
        return;
    }
});

document.getElementById('submitJoinTournament').addEventListener('click', () => {
    const tournamentId = document.getElementById('tournamentIdInput').value.trim();

    if (tournamentId) {
        console.log("Tentative de rejoindre le tournoi avec l'ID :", tournamentId);
        joinTournament(tournamentId);
    } else {
        alert("Veuillez entrer un ID de tournoi valide.");
    }
});


// Ajout d'événements pour les boutons
document.getElementById('player1CameraBtn').addEventListener('click', setCameraPlayer1);
document.getElementById('player2CameraBtn').addEventListener('click', setCameraPlayer2);
document.getElementById('topViewCameraBtn').addEventListener('click', setCameraTopView);
// document.getElementById('localplay_4players_btn').addEventListener('click', localPlay4Players);


document.getElementById('startGameButton').addEventListener('click', () => {
    hideBtn('start_btn');
    displayPlayersInScene(players, scene);  // Appelle la fonction pour afficher les joueurs
    console.log("La partie a commencé, joueurs ajoutés à la scène");
});

document.getElementById('return_btn_1').addEventListener('click', () => {
    disconnectWebSocket();
    hideBtn('layer2Btns_local');
    hideBtn('layer2Btns_online');
    hideBtn('layer2Btns_tournament');
    showBtn('play_btns');
});

document.getElementById('return_btn_2').addEventListener('click', () => {
    hideBtn('layer2Btns_local');
    hideBtn('layer2Btns_online');
    hideBtn('layer2Btns_tournament');
    showBtn('play_btns');
});

document.getElementById('return_btn_3').addEventListener('click', () => {
    hideBtn('layer2Btns_local');
    hideBtn('layer2Btns_online');
    hideBtn('layer2Btns_tournament');
    showBtn('play_btns');
});

document.getElementById('tournament_btn').addEventListener('click', () => { showBtn('layer2Btns_tournament'); hideBtn('play_btns'); });
document.getElementById('localplay_btn').addEventListener('click', () => { showBtn('layer2Btns_local'); hideBtn('play_btns'); });
document.getElementById('local_1v1_btn').addEventListener('click', () => { hideBtn('layer2Btns_local'); showBtn('start_btn'); localPlay(); });
document.getElementById('local_2v2_btn').addEventListener('click', () => { hideBtn('layer2Btns_local'); showBtn('start_btn'); localPlay4Players(); });



document.querySelector('#online_join_btn').addEventListener('submit', handleSubmit());
document.getElementById('versusai_btn').addEventListener('click', playAI());
document.getElementById('online_1v1_btn').addEventListener('click', () => {
    playOnline(2);
    showChat();
});
document.getElementById('online_2v2_btn').addEventListener('click', () => {
    playOnline(4);
    showChat();
});

document.getElementById('onlineplay_btn').addEventListener('click', async () => {
    console.log("Bouton onlineplay cliqué, initialisation du WebSocket...");
    try {
        await setupWebSocket();
        console.log("WebSocket prêt.");
        showChat();
        showBtn('layer2Btns_online')
        hideBtn('play_btns');
    } catch (error) {
        console.error("Erreur lors de l'établissement du WebSocket :", error);
        return;
    }
});

//document.getElementById('tournament_btn').addEventListener('click', initTournament);
// Appel au backend pour créer un tournoi
document.getElementById('tournament_btn').addEventListener('click', () => {
    // Basculer la classe hidden
    if (tournamentOptions.classList.contains('hidden')) {
        tournamentOptions.classList.remove('hidden');
    } else {
        tournamentOptions.classList.add('hidden');
    }
});


document.getElementById('randomize-colors-btn').addEventListener('click', randomizeColors);


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

