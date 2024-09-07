import * as THREE from 'three';
import { sphere } from './player.js';
import { ballSpeedX, ballSpeedY } from './player.js'; // Si tu veux accéder aux vitesses globales
import { socketState } from '../websockets/socket_pong.js'; // Si la position de la balle est synchronisée avec le serveur
import { getRoomId } from '../websockets/socket_pong.js';


export let ballSpeedX = 0;
export let ballSpeedY = 0;
const INITIAL_BALL_SPEED_X = 5;
const INITIAL_BALL_SPEED_Y = 5;

export const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshPhongMaterial({ color: 0xffffff })
);

export function setBallSpeedX(value) {
    ballSpeedX = value;
}

export function setBallSpeedY(value) {
    ballSpeedY = value;
}

export function getBallSpeedX() {
    return ballSpeedX;
}

export function getBallSpeedY() {
    return ballSpeedY;
}

export function moveBall(delta, walls, players, updateScore) {
    sphere.position.x += ballSpeedX * delta;
    sphere.position.y += ballSpeedY * delta;

    // Gestion des collisions
    let scored = false;
    walls.forEach(wall => {
        const wallBox = new THREE.Box3().setFromObject(wall);
        const sphereBox = new THREE.Box3().setFromObject(sphere);

        if (wallBox.intersectsBox(sphereBox)) {
            if (wall === topWall) {
                updateScore(1);
                scored = true;
            } else if (wall === bottomWall) {
                updateScore(2);
                scored = true;
            } else if (wall === leftWall || wall === rightWall) {
                ballSpeedX *= -1;
            }
        }
    });

    if (!scored) {
        sphere.position.set(sphere.position.x, sphere.position.y);
    } else {
        sphere.position.set(0, 0, 0);
        ballSpeedX = INITIAL_BALL_SPEED_X;
        ballSpeedY = INITIAL_BALL_SPEED_Y;
    }
}
