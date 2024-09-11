import * as THREE from 'three';
import { socketState } from '../websockets/socket_pong.js'; // Si la position de la balle est synchronisée avec le serveur
import { updateScore } from './score.js';
import { handlePlayerCollision, handleWallCollision } from './collision.js';

export const INITIAL_BALL_SPEED_X = 5;
export const INITIAL_BALL_SPEED_Y = 5;

export const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshPhongMaterial({ color: 0xffffff })
);

export function addBallToScene(scene) {
    sphere.position.set(0, 0, 0);
    scene.add(sphere);
}

export function moveBall(delta, walls, players) {
    // Mise à jour de la position de la balle
    sphere.position.x += ballSpeedX * delta;
    sphere.position.y += ballSpeedY * delta;

    // Gestion des collisions avec les murs
    let scored = handleWallCollision(walls, sphere);

    // Gestion des collisions avec les joueurs
    handlePlayerCollision(players, sphere);

    // Si un score est marqué, réinitialise la position et la vitesse de la balle
    if (scored) {
        updateScore(scored.player);
        sphere.position.set(0, 0, 0);
        ballSpeedX = INITIAL_BALL_SPEED_X;
        ballSpeedY = INITIAL_BALL_SPEED_Y;
    } else {
        sphere.position.set(sphere.position.x, sphere.position.y);
    }
}

// Fonction pour envoyer périodiquement l'état de la balle au serveur
export function sendBallState() {
    if (socketState.socket && socketState.isSocketReady) {
        let cmd = "ballSync";
        const ballData = {
            x: sphere.position.x,
            y: sphere.position.y,
            vx: ballSpeedX,
            vy: ballSpeedY
        };
        socketState.socket.send(JSON.stringify({ cmd, ballData }));
    }
}
// Envoyer l'état de la balle toutes les 100ms pour réduire la surcharge réseau
setInterval(sendBallState, 200); // Réduire la fréquence à toutes les 200 ms
