import * as THREE from 'three';
import { socketState } from '../websockets/socket_pong.js'; // Synchronisation des mouvements des joueurs
import { wallLength } from './wall.js'; // Pour les limites du terrain
import { local_game } from '../pong.js';
import { addPlayerToGame, removeAllPlayers, players, getBallSpeedX, getBallSpeedY } from '../utils/setter.js';
import { sphere } from './ball.js';

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
export function initializePlayers(scene, useAI = false) {
    removeAllPlayers(scene);  // Retire tous les joueurs existants

    // Ajoute le premier joueur
    addPlayerToGame(1, 0, -wallLength / 2 + 0.5, 0, 0x00ff00, scene); // Joueur 1 (vert)

    if (useAI) {
        // Ajoute un joueur IA
        addPlayerToGame(2, 0, wallLength / 2 - 0.5, 0, 0xff0000, scene, true); // IA (rouge)
    } else {
        // Ajoute un deuxième joueur humain
        addPlayerToGame(2, 0, wallLength / 2 - 0.5, 0, 0x0000ff, scene); // Joueur 2 (bleu)
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

export class AIPlayer extends Player {
    constructor(id, x, y, z, color) {
        console.log('AIPlayer is being initialized');
        super(id, x, y, z, color);
        this.targetX = 0;
        this.aiInterval = setInterval(() => this.calculateMovement(), 1000);
    }

    predictBallImpact() {
        let predictedPosition = new THREE.Vector2(sphere.position.x, sphere.position.y);
        let predictedSpeed = new THREE.Vector2(getBallSpeedX(), getBallSpeedY());
        const ballRadius = sphere.geometry.parameters.radius;
        const maxIterations = 1000;
        let iterations = 0;

        while (predictedPosition.y > -wallLength / 2 && predictedPosition.y < wallLength / 2 && iterations < maxIterations) {
            predictedPosition.add(predictedSpeed);

            if (predictedPosition.x - ballRadius <= -wallLength / 2 || predictedPosition.x + ballRadius >= wallLength / 2) {
                predictedSpeed.x *= -1;
            }

            iterations++;
        }

        return predictedPosition.x;
    }

    calculateMovement() {
        this.targetX = this.predictBallImpact();
    }

    update(delta) {
        const speed = 20;
        const aiPosition = this.mesh.position.x;
        const tolerance = 1;

        if (Math.abs(this.targetX - aiPosition) > tolerance) {
            let moveDirection = (this.targetX - aiPosition) > 0 ? speed * delta : -speed * delta;

            let newX = this.mesh.position.x + moveDirection;
            if (newX - this.mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
                newX + this.mesh.geometry.parameters.width / 2 <= wallLength / 2) {
                this.mesh.position.x = newX;
            }
        }
    }

    destroy() {
        clearInterval(this.aiInterval);
    }
}