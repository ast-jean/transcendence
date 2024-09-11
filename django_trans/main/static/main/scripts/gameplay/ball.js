import * as THREE from 'three';
import { socketState } from '../websockets/socket_pong.js'; // Si la position de la balle est synchronisée avec le serveur
import { getRoomId } from '../websockets/socket_pong.js';
import { updateScore } from './score.js';
import { delta } from '../pong.js';


export let ballSpeedX = 0;
export let ballSpeedY = 0;
export const INITIAL_BALL_SPEED_X = 5;
export const INITIAL_BALL_SPEED_Y = 5;

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

export function addBallToScene(scene) {
    sphere.position.set(0, 0, 0);
    scene.add(sphere);
}
function handlePlayerCollision(players, sphere) {
    players.forEach(player => {
        const playerBox = new THREE.Box3().setFromObject(player.mesh);
        const sphereBox = new THREE.Box3().setFromObject(sphere);

        if (playerBox.intersectsBox(sphereBox)) {
            // Ajustement de l'angle de rebond
            let relativeIntersectY = (sphere.position.y - player.mesh.position.y) / (player.mesh.geometry.parameters.height / 2);
            let bounceAngle = relativeIntersectY * (Math.PI / 4);

            let speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
            ballSpeedX = speed * Math.cos(bounceAngle) * (sphere.position.x > player.mesh.position.x ? 1 : -1);
            ballSpeedY = speed * Math.sin(bounceAngle);

            // Limite pour éviter des rebonds trop faibles
            if (Math.abs(ballSpeedX) < speed * 0.5) {
                ballSpeedX = Math.sign(ballSpeedX) * speed * 0.5;
            }
        }
    });
}

//function handlePlayerCollision(players, sphere, ballSpeed) {
//    players.forEach(player => {
//        const playerBox = new THREE.Box3().setFromObject(player.mesh);
//        const sphereBox = new THREE.Box3().setFromObject(sphere);
//
//        if (playerBox.intersectsBox(sphereBox)) {
//            let relativeIntersectY = (sphere.position.y - player.mesh.position.y) / (player.mesh.geometry.parameters.height / 2);
//            let bounceAngle = relativeIntersectY * (Math.PI / 4);  // Ajuste l'angle pour limiter les rebonds
//
//            let speed = ballSpeed.length();
//            if (sphere.position.x > player.mesh.position.x) {
//                ballSpeed.set(Math.abs(speed * Math.cos(bounceAngle)), speed * Math.sin(bounceAngle));
//            } else {
//                ballSpeed.set(-Math.abs(speed * Math.cos(bounceAngle)), speed * Math.sin(bounceAngle));
//            }
//
//            // Éviter les rebonds trop faibles
//            if (Math.abs(ballSpeed.x) < speed * 0.5) {
//                ballSpeed.x = Math.sign(ballSpeed.x) * speed * 0.5;
//            }
//
//            ballSpeed.normalize().multiplyScalar(speed);
//        }
//    });
//}

function handleWallCollision(walls, sphere) {
    let scored = false;

    walls.forEach(wall => {
        const wallBox = new THREE.Box3().setFromObject(wall);
        const sphereBox = new THREE.Box3().setFromObject(sphere);

        if (wallBox.intersectsBox(sphereBox)) {
            if (wall.name === 'topWall') {
                scored = { player: 1 };  // Score pour le joueur 1
            } else if (wall.name === 'bottomWall') {
                scored = { player: 2 };  // Score pour le joueur 2
            } else if (wall.name === 'leftWall' || wall.name === 'rightWall') {
                // Inverser la direction sur l'axe X si la balle touche les murs gauche ou droit
                ballSpeedX *= -1;
                // Pour éviter que la balle "colle" au mur, on la repousse légèrement
                sphere.position.x += ballSpeedX * delta * 2;
            }
        }
    });

    return scored;
}




export function moveBall(delta, walls, players) {
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
