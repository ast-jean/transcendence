import * as THREE from 'three';
import { delta } from "../pong.js";
import { getBallSpeedX, getBallSpeedY, setBallSpeedX, setBallSpeedY } from '../utils/setter.js';
import { players } from '../utils/setter.js';

//export function handleWallCollision(walls, sphere) {
//    let scored = false;
//
//    walls.forEach(wall => {
//        const wallBox = new THREE.Box3().setFromObject(wall);
//        const sphereBox = new THREE.Box3().setFromObject(sphere);
//
//        if (wallBox.intersectsBox(sphereBox)) {
//            if (wall.name === 'topWall') {
//                scored = { player: 1 };
//            } else if (wall.name === 'bottomWall') {
//                scored = { player: 2 };
//            } else if (wall.name === 'leftWall' || wall.name === 'rightWall') {
//                // Inverser la direction sur l'axe X si la balle touche les murs gauche ou droit
//                setBallSpeedX(getBallSpeedX() * -1)
//                // Pour éviter que la balle "colle" au mur, on la repousse légèrement
//                sphere.position.x += getBallSpeedX() * delta * 2;
//            }
//        }
//    });
//    return scored;
//}

export function handleWallCollision(walls, sphere, isFourPlayerMode) {
    let scored = false;

    walls.forEach(wall => {
        const wallBox = new THREE.Box3().setFromObject(wall);
        const sphereBox = new THREE.Box3().setFromObject(sphere);

        if (wallBox.intersectsBox(sphereBox)) {
            if (isFourPlayerMode) {
                // Mode 4 joueurs : chaque mur retire une vie au joueur associé
                if (wall.name === 'topWall') {
                    handlePlayerLifeLoss(2);  // Joueur 2 en haut
                    setBallSpeedY(getBallSpeedY() * -1);
                    sphere.position.y = wallBox.min.y - sphere.geometry.parameters.radius;  // Repositionne la balle juste en dessous du mur
                } else if (wall.name === 'bottomWall') {
                    handlePlayerLifeLoss(1);  // Joueur 1 en bas
                    setBallSpeedY(getBallSpeedY() * -1);
                    sphere.position.y = wallBox.max.y + sphere.geometry.parameters.radius;  // Repositionne la balle juste au-dessus du mur
                } else if (wall.name === 'leftWall') {
                    handlePlayerLifeLoss(3);  // Joueur 3 à gauche
                    setBallSpeedX(getBallSpeedX() * -1);
                    sphere.position.x += getBallSpeedX() * delta * 2;
                } else if (wall.name === 'rightWall') {
                    handlePlayerLifeLoss(4);  // Joueur 4 à droite
                    setBallSpeedX(getBallSpeedX() * -1);
                    sphere.position.x += getBallSpeedX() * delta * 2;
                }
            } else {
                // Mode 2 joueurs : seuls les murs du haut et du bas comptent
                if (wall.name === 'topWall') {
                    scored = { player: 1 };  // Score pour le joueur 1
                } else if (wall.name === 'bottomWall') {
                    scored = { player: 2 };  // Score pour le joueur 2
                } else if (wall.name === 'leftWall' || wall.name === 'rightWall') {
                    // Inverser la direction sur l'axe X si la balle touche les murs gauche ou droit
                    setBallSpeedX(getBallSpeedX() * -1);
                    // Pour éviter que la balle "colle" au mur, on la repousse légèrement
                    sphere.position.x += getBallSpeedX() * delta * 2;
                }
            }
        }
    });

    return scored;
}

// Fonction pour gérer la perte de vie des joueurs
function handlePlayerLifeLoss(playerId) {
    let player = players.find(p => p.id === playerId);
    if (player && player.lives > 0) {
        player.loseLife();
        console.log(`Player ${playerId} has ${player.lives} lives remaining.`);
        if (!player.isAlive()) {
            console.log(`Player ${playerId} is out of the game!`);
            player.mesh.material.color.setHex(0x808080); // Le joueur devient gris
            // Accélère la balle quand un joueur est éliminé
            increaseBallSpeed();
        }
    }
}

// Fonction pour augmenter la vitesse de la balle
function increaseBallSpeed() {
    const currentSpeedX = getBallSpeedX();
    const currentSpeedY = getBallSpeedY();
    setBallSpeedX(currentSpeedX * 1.2);  // Augmente la vitesse de 20%
    setBallSpeedY(currentSpeedY * 1.2);
}


export function handlePlayerCollision(players, sphere, ballSpeed) {
    players.forEach((player, index) => {
        const playerBox = new THREE.Box3().setFromObject(player.mesh);
        const sphereBox = new THREE.Box3().setFromObject(sphere);

        if (playerBox.intersectsBox(sphereBox)) {

            // Calcul de l'angle de rebond
            let relativeIntersectY = (sphere.position.y - player.mesh.position.y) / (player.mesh.geometry.parameters.height / 2);
            let bounceAngle = relativeIntersectY * (Math.PI / 4);  // Ajuste l'angle pour limiter les rebonds

            // Calcul de la vitesse après collision
            let speed = ballSpeed.length();

            if (sphere.position.x > player.mesh.position.x) {
                ballSpeed.set(Math.abs(speed * Math.cos(bounceAngle)), speed * Math.sin(bounceAngle));
            } else {
                ballSpeed.set(-Math.abs(speed * Math.cos(bounceAngle)), speed * Math.sin(bounceAngle));
            }

            // Limite pour éviter des rebonds trop faibles
            if (Math.abs(ballSpeed.x) < speed * 0.5) {
                ballSpeed.x = Math.sign(ballSpeed.x) * speed * 0.5;
            }

            ballSpeed.normalize().multiplyScalar(speed);

            setBallSpeedX(ballSpeed.x);
            setBallSpeedY(ballSpeed.y);
        }
    });
}

// export function handlePlayerCollision(players, sphere) {
//     players.forEach(player => {
//         const playerBox = new THREE.Box3().setFromObject(player.mesh);
//         const sphereBox = new THREE.Box3().setFromObject(sphere);

//         if (playerBox.intersectsBox(sphereBox)) {

//             // Calcul de l'angle de rebond
//             let relativeIntersectY = (sphere.position.y - player.mesh.position.y) / (player.mesh.geometry.parameters.height / 2);
//             let bounceAngle = relativeIntersectY * (Math.PI / 4);

//             // Calcul de la vitesse après collision
//             let speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
//             console.log(`Bounce angle: ${bounceAngle}, Speed: ${speed}`);

//             // Mise à jour de la vitesse de la balle après la collision
//             ballSpeedX = speed * Math.cos(bounceAngle) * (sphere.position.x > player.mesh.position.x ? 1 : -1);
//             ballSpeedY = speed * Math.sin(bounceAngle);

//             // Limite pour éviter des rebonds trop faibles
//             if (Math.abs(ballSpeedX) < speed * 0.5) {
//                 ballSpeedX = Math.sign(ballSpeedX) * speed * 0.5;
//             }

//         }
//     });
// }