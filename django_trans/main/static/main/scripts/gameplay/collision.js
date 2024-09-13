import * as THREE from 'three';
import { delta } from "../pong.js";
import { getBallSpeedX, setBallSpeedX, setBallSpeedY } from '../utils/setter.js';

export function handleWallCollision(walls, sphere) {
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
                setBallSpeedX(getBallSpeedX() * -1)
                // Pour éviter que la balle "colle" au mur, on la repousse légèrement
                sphere.position.x += getBallSpeedX() * delta * 2;
            }
        }
    });

    return scored;
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