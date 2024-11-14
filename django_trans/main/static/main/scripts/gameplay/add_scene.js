import * as THREE from 'three';
import { startCountdown, showBtn, hideBtn } from '../ui/ui_updates.js';
import { addBallToScene } from './ball.js';
import { isFourPlayerMode, localPlayerId } from '../utils/setter.js';


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
    if (!isFourPlayerMode) {
        if (players[0].alias) {
            document.getElementById('p1Name').textContent = players[0].alias + ':';
        } else {
            if (players[0].name)
                document.getElementById('p1Name').textContent = players[0].name + ':';
        }
        if (players[1].alias) {
            document.getElementById('p2Name').textContent = players[1].alias + ':';
        } else {
            document.getElementById('p2Name').textContent = players[1].name + ':';
        }
        if(localPlayerId) {
            if (players[0]  == localPlayerId) {
                document.getElementById('p1Name').addClassList = 'text-warning';
            }
            if (players[1]  == localPlayerId) {
                document.getElementById('p1Name').addClassList = 'text-warning';
            }
        }
    }
        
    showBtn('scoreboard');

    hideBtn('start_btn');
    addBallToScene(scene);
    console.log(players);
    startCountdown();
}
