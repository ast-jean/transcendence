import * as THREE from 'three';
import { room_id, socketState } from '../websockets/socket_pong.js';
import { updateScore } from './score.js';
import { handlePlayerCollision, handleWallCollision } from './collision.js';
import { getBallSpeedX, getBallSpeedY, isFourPlayerMode, isGameOver, setBallSpeedX, setBallSpeedY } from '../utils/setter.js';

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
    sphere.position.x += getBallSpeedX() * delta;
    sphere.position.y += getBallSpeedY() * delta;

    let ballSpeed = new THREE.Vector2(getBallSpeedX(), getBallSpeedY());

    // Gestion des collisions avec les murs

    let scored = handleWallCollision(walls, sphere, isFourPlayerMode);
    // Gestion des collisions avec les joueurs
    handlePlayerCollision(players, sphere, ballSpeed);

    // Si un score est marqué, réinitialise la position et la vitesse de la balle
    if (scored) {
        updateScore(scored.player);
        sphere.position.set(0, 0, 0);
        setBallSpeedX(INITIAL_BALL_SPEED_X);
        setBallSpeedY(INITIAL_BALL_SPEED_Y);
    } else {
        sphere.position.set(sphere.position.x, sphere.position.y);
    }
}

// Fonction pour envoyer périodiquement l'état de la balle au serveur
export function sendBallState() {
    if (socketState.socket && socketState.isSocketReady && room_id && !isGameOver) {
        let cmd = "ballSync";
        let roomId = room_id;
        const ballData = {
            x: sphere.position.x,
            y: sphere.position.y,
            vx: getBallSpeedX(),
            vy: getBallSpeedY()
        };
<<<<<<< HEAD
        socketState.socket.send(JSON.stringify({ cmd, roomId: room_id, ballData }));
=======
        socketState.socket.send(JSON.stringify({ cmd, roomId, ballData }));
>>>>>>> main
    }
}
// Envoyer l'état de la balle toutes les 100ms pour réduire la surcharge réseau
setInterval(sendBallState, 200); // Réduire la fréquence à toutes les 200 ms
