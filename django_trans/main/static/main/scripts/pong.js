// Import des modules nécessaires
import * as THREE from 'three';

import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.153.0/examples/jsm/controls/OrbitControls.js';
import { AIPlayer, initializePlayers, initializePlayers4, movePlayer } from './gameplay/player.js';
import { moveBall, addBallToScene } from './gameplay/ball.js';
import { setupWalls, setWallColor, walls } from './gameplay/wall.js';
import { checkAllPlayersConnected, getRoomId, sendCmd, socketState, setupWebSocket, disconnectWebSocket, getName } from './websockets/socket_pong.js';
import { randomizeColors } from './ui/colors.js';
import { hideAllButtons, hideBtn, showBtn } from './ui/ui_updates.js';
import { players, setPlayerMode, localPlayerId, setID, setLocalMode, setIsTournament, modal, setBallSpeedX, setBallSpeedY, room_id} from './utils/setter.js';

import { displayPlayersInScene } from './gameplay/add_scene.js';
import { addChat, showChat } from './ui/chat.js';
import { setCameraPlayer1, setCameraPlayer2, setCameraTopView } from './ui/camera.js';
import { Tournament, createTournamentLobby } from './tournament/tournament.js';
import { tournament } from './utils/setter.js';
import { displayDebugInfo } from './utils/utils.js';
import { showTournamentOptions } from './ui/ui_tournament.js';

// Variables globales du jeu
var clock;
export var delta;
export let local_game = false;
export let useAIForPlayer2 = false;

// Configuration variables Three.js
export let container;
export let width;
export let height;
export let scene;
export let camera;

//window variables
let renderer;
let winGame;

//lighting
let directionalLight;
let ambientLight
var focused = true;
let pageIsPong = false;
export let controls;
let tournamentOptions;

export function init_pong() {
    console.log("Initializing Pong...");
    clock = new THREE.Clock();
    container = document.getElementById('gameCont');
    width = container.clientWidth;
    height = container.clientWidth * 0.666;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    renderer.setClearColor(0x000001)
    winGame = renderer.domElement;
    winGame.classList.add("rounded")
    container.appendChild(winGame);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    resizeBackground();

    // Configuration des murs
    setupWalls(scene);
    setWallColor(0x808080);

    // Contrôles de caméra
    controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, -15, 10);  // Position initiale de la caméra
    camera.lookAt(0, 0, 0);           // Assure qu'elle regarde le centre de la scène

    // Lumières
    directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0, 20, 10);
    scene.add(directionalLight);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    tournamentOptions = document.getElementById('tournamentOptions');
    init_eventListener();
    // Lancement de l'animation
    pageIsPong = true;
    animate();
    console.log("Done init Pong...");
}
export function unload_pong() {
    console.log("Unloading Pong...");

    // Stop any active game loop or animations
    if (clock) {
        clock = null; // Reset the clock
    }

    if (renderer) {
        // Remove the renderer's canvas element from the DOM
        const canvas = renderer.domElement;
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }

        // Dispose of the renderer to release GPU resources
        renderer.dispose();
        renderer = null;
    }

    // Dispose of the scene
    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach((material) => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        // Remove all children from the scene
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }

        scene = null; // Reset the scene
    }

    // Dispose of the camera
    if (camera) {
        camera = null;
    }

    // Dispose of controls
    if (controls) {
        controls.dispose();
        controls = null;
    }

    // Dispose of lighting
    if (directionalLight) {
        directionalLight = null;
    }
    if (ambientLight) {
        ambientLight = null;
    }

    // Reset container variables
    if (container) {
        container.innerHTML = ''; // Clear the container
        container = null;
    }

    // Reset global variables
    delta = null;
    local_game = false;
    useAIForPlayer2 = false;
    pageIsPong = false;
    console.log("Pong successfully unloaded.");
}


function resizeBackground() {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.backgroundSize = `${window.innerWidth}px ${window.innerHeight}px`;
    }
}

window.onfocus = function() {
    focused = true;
};
window.onblur = function() {
    focused = false;
};


function handleScroll() {
    resizeBackground(); // Adjust background on scroll
}
function handleResize() {
    resizeBackground(); // Adjust background on resize
}

document.addEventListener('DOMContentLoaded', function() {
    hideBtn('loading');
    
});

function localPlay4Players() {
    ////console.log("Initialisation du mode Local Play à 4 joueurs");
    initializePlayers4()
    setPlayerMode(true);
    setLocalMode(true);
    const scoreboard = document.getElementById('scoreboard');
    scoreboard.innerHTML = "P1 : ❤️❤️❤️ | P2 : ❤️❤️❤️ | P3 : ❤️❤️❤️ | P4 : ❤️❤️❤️ |";
    displayPlayersInScene(players, scene); 
}

// Démarrage du jeu local
function localPlay() {
    local_game = true;
    setLocalMode(true);
    initializePlayers(scene, false, false);
    displayPlayersInScene(players, scene); 
}

// Démarrage du jeu contre l'IA
function playAI() {
    hideAllButtons();
    setID(1);
    local_game = true;
    showBtn('scoreboard');
    initializePlayers(scene, true, false);  // true pour indiquer qu'on joue contre une IA
    displayPlayersInScene(players, scene); 
}

export function startGame_online() {
    displayPlayersInScene(players, scene); 
}

async function playOnline(maxPlayers) {
    // Si le WebSocket est prêt, continuer avec la création de la room
    if (socketState.isSocketReady) {
        //console.log(`Création de la room pour ${maxPlayers} joueurs.`);
        sendCmd(`roomCreate${maxPlayers}`);
        try {
            // Attend la confirmation de la création de la room (par exemple, room ID)
            await waitForRoomId();
            //console.log("Room créée avec succès.");
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
            //console.log("Tous les joueurs sont connectés.");
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
    ////console.log(`Tournament ${tournamentId} initialized with max ${maxPlayers} players`);
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
    if (pageIsPong) {
        requestAnimationFrame(animate);
        delta = clock.getDelta();
        movePlayer(delta, scene);
        moveBall(delta, walls, players);
        //controls.update();
        resizeRendererToDisplaySize(renderer);
        renderer.render(scene, camera);
        const player2 = players[1];
        if (player2 instanceof AIPlayer) {
            ////console.log("Updating AI Player...");
            player2.update(delta);
        }
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

// Fonction de gestion du submit
function handleSubmit(event) {
    event.preventDefault(); // Prevent the default form submission
    ////console.log('handleSubmit called'); // Vérifie si la fonction est appelée

    let input = document.querySelector('input[name="searchRoom"]');
    const roomId = input.value;
    ////console.log('Room ID:', roomId); // Vérifie la valeur du champ
    if (!roomId) {
        alert("Please fill in all required fields.");
    } else {
        hideBtn('layer2Btns_online');
        hideBtn('layer2Btns_tournament');
        sendCmd("roomSearch", roomId);
        ////console.log("Searching for Room #" + roomId);
    }
}


function init_eventListener() {
    document.addEventListener('keydown', function (event) {
        if (event.key === 'i') {
            displayDebugInfo();
        }
    });
    
// Gestionnaire d'événements pour le bouton Créer un tournoi
document.getElementById('createTournamentBtn').addEventListener('click', async () => {
    ////console.log("Création d'un nouveau tournoi");
    // Envoyer la commande au serveur pour créer un tournoi
    try {
        await setupWebSocket();
        ////console.log("WebSocket prêt.");
        sendCmd("createTournamentLobby");
        ////console.log(`Commande envoyée pour créer le tournoi`);
        setIsTournament(true);
    } catch (error) {
        console.error("Erreur lors de l'établissement du WebSocket :", error);
        return;
    }
});

// Gestionnaire d'événements pour le bouton Rejoindre un tournoi
document.getElementById('joinTournamentBtn').addEventListener('click', async () => {
    ////console.log("Rejoindre un tournoi existant");
    try {
        await setupWebSocket();
        ////console.log("WebSocket prêt.");
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
        //console.log("Tentative de rejoindre le tournoi avec l'ID :", tournamentId);
        joinTournament(tournamentId);
    } else {
        alert("Veuillez entrer un ID de tournoi valide.");
    }
});

document.getElementById('startFinalBtn').addEventListener('click', () => {
    // Vérifie si un tournoi est en cours et récupère l'ID du tournoi
    if (tournament && tournament.tournamentId) {
        const data = {
            "cmd": "startFinal",
            "roomId": room_id,
        }
        // Envoie la commande au serveur via le WebSocket
        socketState.socket.send(JSON.stringify(data));
        ////console.log(`Commande envoyée pour démarrer le tournoi ID ${tournament.tournamentId}`);
    } else {
        ////console.log("Aucun tournoi actif à démarrer.");
    }
});

document.getElementById('startTournamentBtn').addEventListener('click', () => {
    ////console.log("Début du tournoi !");
    // Vérifie si un tournoi est en cours et récupère l'ID du tournoi
    if (tournament && tournament.tournamentId) {
        const cmd = {
            cmd: "startTournament",
            tournamentId: tournament.tournamentId // L'ID du tournoi que vous gérez
        };

        // Envoie la commande au serveur via le WebSocket
        socketState.socket.send(JSON.stringify(cmd));
        ////console.log(`Commande envoyée pour démarrer le tournoi ID ${tournament.tournamentId}`);
    } else {
        ////console.log("Aucun tournoi actif à démarrer.");
    }
});

document.getElementById('startGameButton').addEventListener('click', () => {
    hideBtn('start_btn');
    showBtn('scoreboard');
    if (!local_game) {
        sendCmd("startGame", room_id);
    }
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

// Ajout d'événements pour les boutons
document.getElementById('player1CameraBtn').addEventListener('click', setCameraPlayer1);
document.getElementById('player2CameraBtn').addEventListener('click', setCameraPlayer2);
document.getElementById('topViewCameraBtn').addEventListener('click', setCameraTopView);

document.getElementById('tournament_btn').addEventListener('click', () => { showBtn('layer2Btns_tournament'); hideBtn('play_btns'); });
document.getElementById('localplay_btn').addEventListener('click', () => { showBtn('layer2Btns_local'); hideBtn('play_btns'); });
document.getElementById('local_1v1_btn').addEventListener('click', () => { hideBtn('layer2Btns_local'); showBtn('start_btn'); localPlay(); });
document.getElementById('local_2v2_btn').addEventListener('click', () => { hideBtn('layer2Btns_local'); showBtn('start_btn'); localPlay4Players(); });
document.querySelector('#online_join_btn').addEventListener('submit', handleSubmit);
document.getElementById('versusai_btn').addEventListener('click', playAI);
document.getElementById('online_1v1_btn').addEventListener('click', () => {
    playOnline(2);
    showChat();
});
document.getElementById('online_2v2_btn').addEventListener('click', () => {
    playOnline(4);
    showChat();
});

document.getElementById('onlineplay_btn').addEventListener('click', async () => {
    ////console.log("Bouton onlineplay cliqué, initialisation du WebSocket...");
    try {
        await setupWebSocket();
        ////console.log("WebSocket prêt.");
        showChat();
        showBtn('layer2Btns_online')
        hideBtn('play_btns');
    } catch (error) {
        console.error("Erreur lors de l'établissement du WebSocket :", error);
        return;
    }
});

// Appel au backend pour créer un tournoi
document.getElementById('tournament_btn').addEventListener('click', () => {
    // Basculer la classe hidden
    if (tournamentOptions.classList.contains('hidden')) {
        tournamentOptions.classList.remove('hidden');
    } else {
        tournamentOptions.classList.add('hidden');
    }
});

document.getElementById('menu-btn-quit').addEventListener('click', () => {
    location.reload();
});

document.getElementById('randomize-colors-btn').addEventListener('click', randomizeColors);

}


function joinTournament(tournamentId) {
    // Vérifier si le WebSocket est prêt
    if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
        sendCmd('joinTournament', tournamentId);
        ////console.log("Requête envoyée pour rejoindre le tournoi :", tournamentId);
        setIsTournament(true);
    } else {
        console.error("WebSocket n'est pas prêt.");
        alert("Connexion WebSocket non établie.");
    }
}



export function deleteBall(sphere){
    // Remove the sphere from the scene
    scene.remove(sphere);
    setBallSpeedX(0);
    setBallSpeedY(0);

    // Dispose of the sphere's geometry and material
    sphere.geometry.dispose();
    sphere.material.dispose();

    // Optionally, set the sphere to null to ensure it is fully cleared from memory
    sphere = null;
    
}
