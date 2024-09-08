import * as THREE from 'three';
import { socketState, sendSync } from '../websockets/socket_pong.js'; // Synchronisation des mouvements des joueurs
import { wallLength } from './wall.js'; // Pour les limites du terrain
import { local_game } from '../pong.js';

export let players = [];
export let keyState = {};

export class Player {
    constructor(id, x, y, z, color) {
        this.id = id;
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ color: color })
        );
        this.mesh.position.set(x, y, z);
    }
}

// Initialisation des joueurs (locale ou avec IA)
export function initializePlayers(scene, playerData, useAI = false) {
    players.forEach(player => scene.remove(player.mesh));  // Retirer les joueurs existants
    players = [];

    // Ajout des joueurs humains
    const player1 = new Player(1, 0, -wallLength / 2 + 0.5, 0, 0x00ff00); // Joueur 1 (vert)
    players.push(player1);
    scene.add(player1.mesh);

    if (useAI) {
        // Ajout d'un joueur IA
        const aiPlayer = new Player(2, 0, wallLength / 2 - 0.5, 0, 0xff0000); // IA (rouge)
        players.push(aiPlayer);
        scene.add(aiPlayer.mesh);
    } else {
        // Ajout du deuxième joueur (humain)
        const player2 = new Player(2, 0, wallLength / 2 - 0.5, 0, 0x0000ff); // Joueur 2 (bleu)
        players.push(player2);
        scene.add(player2.mesh);
    }
}

// Fonction pour déplacer les joueurs
export function movePlayer(delta, scene) {
    const speed = 20;
    let x1 = 0, x2 = 0;

    if (players[0]) {        
        if (keyState['ArrowLeft']) x1 -= speed * delta;
        if (keyState['ArrowRight']) x1 += speed * delta;

        if (local_game) {
            if (keyState['KeyA']) x2 -= speed * delta;
            if (keyState['KeyD']) x2 += speed * delta;
        }

        // Mise à jour de la position du joueur 1
        if (x1 !== 0) {
            let newX = players[0].mesh.position.x + x1;
            if (newX - players[0].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
                newX + players[0].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
                players[0].mesh.position.x = newX;
                // Envoi des données de mouvement en ligne
                if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
                    let cmd = "move";
                    const movementData = { x: x1, y: 0 };
                    let roomId = getRoomId();
                    socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
                }
            }
        }

        // Mise à jour de la position du joueur 2
        if (x2 !== 0) {
            let newX = players[1].mesh.position.x + x2;
            if (newX - players[1].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
                newX + players[1].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
                players[1].mesh.position.x = newX;
                // Envoi des données de mouvement en ligne
                if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
                    let cmd = "move";
                    const movementData = { x: x2 * -1, y: 0 };
                    let roomId = getRoomId();
                    socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
                }
            }
        }
    }
}

// Met à jour l'affichage des joueurs
export function updatePlayerVisualization(scene) {
    //console.log(scene); // Devrait afficher une instance de THREE.Scene

    players.forEach(player => {
        scene.add(player.mesh);
    });
}


export function resetPlayer() {
    let local_player = new Player(1, 0, -wallLength / 2 + 0.5, 0);
    players.push(local_player);
    scene.add(local_player.mesh);
    
}

// Gestion des événements de touche
document.addEventListener('keydown', function (e) {
    keyState[e.code] = true; // Marque la touche comme enfoncée
});

document.addEventListener('keyup', function (e) {
    keyState[e.code] = false; // Marque la touche comme relâchée
});