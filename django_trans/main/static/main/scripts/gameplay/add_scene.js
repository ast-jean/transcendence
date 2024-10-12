import * as THREE from 'three';
import { startCountdown } from '../ui/ui_updates.js';
import { addBallToScene } from './ball.js';


/**
 * Parcourt la liste des joueurs et les affiche dans la scène.
 * @param {Array} players - Liste des joueurs.
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle afficher les joueurs.
 */
export function displayPlayersInScene(players, scene) {
    players.forEach(player => {
        if (!scene.children.includes(player.mesh)) {
            // Ajoute le joueur à la scène s'il n'y est pas déjà
            scene.add(player.mesh);
            console.log(`Joueur ${player.ident} ajouté à la scène à la position x=${player.mesh.position.x}, y=${player.mesh.position.y}`);
        } else {
            console.log(`Joueur ${player.ident} déjà présent dans la scène`);
        }
    });
    document.getElementById("scoreboard").classList.remove("visually-hidden");
    addBallToScene(scene);
    startCountdown();
}
