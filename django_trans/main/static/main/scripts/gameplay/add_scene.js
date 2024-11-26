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
        let player1 = players[0];
        let player2 = players[1];
        console.log("Players:>", players);
        if (players[0].ident.ident){
            player1 =  players[0].ident;
            player2 =  players[1].ident;
        }
        if (player1.alias) {
            document.getElementById('p1Name').textContent = player1.alias + ':';
        } else {
            if (player1.name)
                document.getElementById('p1Name').textContent = player1.name + ':';
        }
        if (player2.alias) {
            document.getElementById('p2Name').textContent = player2.alias + ':';
        } else {
            document.getElementById('p2Name').textContent = player2.name + ':';
        }
        if(localPlayerId) {
            if (player1  == localPlayerId) {
                document.getElementById('p1Name').addClassList = 'text-warning';
            }
            if (player2  == localPlayerId) {
                document.getElementById('p1Name').addClassList = 'text-warning';
            }
        }
    }
        
    showBtn('scoreboard');
    hideBtn('start_btn');
    addBallToScene(scene);
    console.log("End of displayPlayersInScene", players);
    startCountdown();
}
