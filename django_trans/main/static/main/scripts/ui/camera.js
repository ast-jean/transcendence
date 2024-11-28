import { camera, controls } from "../pong.js";

export function setCameraPlayer1() {
    camera.position.set(0, -15, 10);  // Caméra du côté du joueur 1
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 0, 1);  // Orientation vers le haut (z positif)
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);  // Assure que les contrôles pointent toujours vers le centre
    controls.update();  // Met à jour les contrôles
    //console.log("Caméra Joueur 1 activée");
    // Uncheck all radios except for Player 1's camera
    document.getElementById('btnradio1').checked = true;
    document.getElementById('btnradio2').checked = false;
    document.getElementById('btnradio3').checked = false;
}

// Fonction pour changer la caméra sur le joueur 2
export function setCameraPlayer2() {
    camera.position.set(0, 15, -10);   // Caméra du côté du joueur 2
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 0, -1);
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);  // Assure que les contrôles pointent toujours vers le centre
    controls.update();  // Met à jour les contrôles
    //console.log("Caméra Joueur 2 activée");
    // Uncheck all radios except for Player 2's camera
    document.getElementById('btnradio1').checked = false;
    document.getElementById('btnradio2').checked = true;
    document.getElementById('btnradio3').checked = false;
}

// Fonction pour la vue de dessus
export function setCameraTopView() {
    camera.position.set(0, 0, 20);    // Caméra positionnée au-dessus
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 1, 0);  // Pour la vue de dessus, l'axe y est orienté vers le haut
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);  // Assure que les contrôles pointent toujours vers le centre
    controls.update();  // Met à jour les contrôles
    //console.log("Vue de dessus activée");
    // Uncheck all radios except for Player 2's camera
    document.getElementById('btnradio1').checked = false;
    document.getElementById('btnradio2').checked = false;
    document.getElementById('btnradio3').checked = true;
}