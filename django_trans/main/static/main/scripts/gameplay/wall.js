import * as THREE from 'three'; // Pour créer les murs

const wallThickness = 0.5;
export const wallLength = 20;
export const walls = [];
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

/**
 * Crée et place un mur dans la scène
 * @param {THREE.Scene} scene - La scène Three.js
 * @param {Object} position - La position du mur (x, y, z)
 * @param {THREE.BoxGeometry} geometry - La géométrie du mur
 */
function createWall(scene, position, geometry) {
    const wall = new THREE.Mesh(geometry, wallMaterial);
    wall.position.set(position.x, position.y, position.z);
    scene.add(wall);
    walls.push(wall);
}




export function setupWalls(scene) {
    // Crée le mur du haut
    createWall(scene, { x: 0, y: wallLength / 2, z: 0 }, new THREE.BoxGeometry(wallLength, wallThickness, 1));

    // Crée le mur du bas
    createWall(scene, { x: 0, y: -wallLength / 2, z: 0 }, new THREE.BoxGeometry(wallLength, wallThickness, 1));

    // Crée le mur de gauche
    createWall(scene, { x: -wallLength / 2, y: 0, z: 0 }, new THREE.BoxGeometry(wallThickness, wallLength, 1));

    // Crée le mur de droite
    createWall(scene, { x: wallLength / 2, y: 0, z: 0 }, new THREE.BoxGeometry(wallThickness, wallLength, 1));
}

/**
 * Fonction pour changer la couleur des murs
 * @param {Number} color - La nouvelle couleur des murs en format hexadécimal
 */
export function setWallColor(color) {
    walls.forEach(wall => {
        wall.material.color.set(color);
    });
}

/**
 * Fonction pour enlever les murs de la scène
 * @param {THREE.Scene} scene - La scène Three.js
 */
export function removeWalls(scene) {
    walls.forEach(wall => {
        scene.remove(wall);
        if (wall.geometry) wall.geometry.dispose();
        if (wall.material) wall.material.dispose();
    });
    walls.length = 0; // Vider le tableau des murs
}
