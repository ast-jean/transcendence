import * as THREE from 'three';
import { socket } from './socket_pong.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var clock = new THREE.Clock();

const container = document.getElementById('gameCont');
const width = container.clientWidth;
const height = container.clientWidth * 0.666;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
renderer.setClearColor(0x000001);
// renderer.domElement.style.aspectRatio = 'auto 1 / 1';
container.appendChild(renderer.domElement);

var localplay = document.getElementById("localplay_btn");
localplay.addEventListener("click", localgame);



export let players = [];

function hideAllButtons() {
    const buttons = document.querySelectorAll('.game-button');
    buttons.forEach(button => {
        button.classList.add('hidden');
    });
}

document.querySelectorAll('.game-button').forEach(button => {
    button.addEventListener('click', hideAllButtons);
});

let ballSpeedX = 15
let ballSpeedY = 15

// Créer les murs
const wallThickness = 0.5;
const wallLength = 20;
const walls = [];
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); 

// Mur du fond
const topWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallLength, wallThickness, 1),
    wallMaterial
);
topWall.position.set(0, wallLength / 2, 0);
scene.add(topWall);
walls.push(topWall);
console.log("Top wall created at:", topWall.position);

// Mur du bas
const bottomWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallLength, wallThickness, 1),
    wallMaterial
);
bottomWall.position.set(0, -wallLength / 2, 0);
scene.add(bottomWall);
walls.push(bottomWall);
console.log("Bottom wall created at:", bottomWall.position);

// Mur de gauche
const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallLength, 1),
    wallMaterial
);
leftWall.position.set(-wallLength / 2, 0, 0);
scene.add(leftWall);
walls.push(leftWall);
console.log("Left wall created at:", leftWall.position);

// Mur de droite
const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallLength, 1),
    wallMaterial
);
rightWall.position.set(wallLength / 2, 0, 0);
scene.add(rightWall);
walls.push(rightWall);
console.log("Right wall created at:", rightWall.position);

var index = 0;
function localgame() {
    // have fun!
    console.log("in localgame function", index);
    localplay.style.hidden = true;

    let player1 = new Player(1, 0, -wallLength / 2 + 1, 0);// près de l'écran
    players.push(player1);
    scene.add(player1.mesh);

    let player2 = new Player(2, 0, wallLength / 2 - 1, 0);  // plus loin
    players.push(player2);
    scene.add(player2.mesh);

    updatePlayerVisualization();
}

const controls = new OrbitControls(camera, renderer.domElement);

// Resize game window on window resize
// window.addEventListener('resize', onWindowResize, false);

// const axesHelper = new THREE.AxesHelper(10);
// scene.add(axesHelper);

function onWindowResize() {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// function resizeRendererToDisplaySize(renderer) {
//     const canvas = renderer.domElement;
//     const width = canvas.clientWidth;
//     const height = canvas.clientWidth;
//     const needResize = canvas.width !== width || canvas.height !== height;
//     if (needResize) {
//       renderer.setSize(width, height, false);
//     }
//     return needResize;
// }

export function removePlayer(playerIdToRemove) {
    console.log("Removing player");
    let player = players.find(p => p.id === playerIdToRemove);
    removeMeshFromScene(player.mesh, scene);
    players = players.filter(player => player.id !== playerIdToRemove);
    updatePlayerVisualization();
}

let colors = [
    0x00ff00, // Green
    0x0000ff, // Blue
    0xff0000, // Red
    0xffff00, // Yellow
    0x00ffff, // Cyan
    0xff00ff, // Magenta
    0xffa500, // Orange
    0x800080, // Purple
    0x008080, // Teal
    0x808000  // Olive
];
let i = 0;

export class Player {
    constructor(id, x, y, z) {
        this.id = id;

        let material = new THREE.MeshBasicMaterial({ color: colors[i++] });
        material.opacity = 1;
        material.transparent = true;
        material.needsUpdate = true;

        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 0.5), material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
        console.log('New player:', this);
    }
}
// players.push(new Player(0, 0, 0, 0));

// Create a sphere geometry
// The parameters are: radius, widthSegments, heightSegments
const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
// sphereMaterial.opacity = 0.5; 
// sphereMaterial.transparent = true;
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0, 0, 0);
scene.add(sphere);

// If using lights and a material that reacts to light
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(5, 5, 5);
scene.add(light);

export function updatePlayerVisualization() {
    if (players.length > 0) {
        players.forEach(player => {
            scene.add(player.mesh);
        });
    }
}

export var delta;

var keyState = {};

document.addEventListener('keydown', function (e) {
    if (['ArrowLeft', 'ArrowRight', 'KeyA','KeyD'].includes(e.code)) {
        keyState[e.code] = true;
        e.preventDefault(); // Prevent default here, for arrow keys and WASD keys.
    }
}, true);

document.addEventListener('keyup', function (e) {
    if (['ArrowLeft','ArrowRight','KeyA',  'KeyD'].includes(e.code)) {
        keyState[e.code] = false;
        e.preventDefault(); // It's usually not necessary to prevent default on keyup, but it's here for consistency.
    }
}, true);


export function movePlayer(delta) {
    const speed = 20; // Adjust speed as necessary
    let x1 = 0;
    let x2 = 0;

    // Contrôles pour le joueur 1
    if (keyState['ArrowLeft']) x1 -= speed * delta;
    if (keyState['ArrowRight']) x1 += speed * delta;

    // Contrôles pour le joueur 2 (A et D)
    if (keyState['KeyA']) x2 -= speed * delta;
    if (keyState['KeyD']) x2 += speed * delta;

    // Déplacer le joueur 1
    if (x1 !== 0) {
        let newX = players[0].mesh.position.x + x1;
        if (newX - players[0].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
            newX + players[0].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
            players[0].mesh.position.x = newX;
        }
        if (socket && socket.readyState) {
            let cmd = "move";
            const movementData = { x: x1, y: 0 };
            socket.send(JSON.stringify({ cmd, movementData })); // Sending to gameserv/consumers.py 
        }
    }

    // Déplacer le joueur 2
    if (x2 !== 0) {
        let newX = players[1].mesh.position.x + x2;
        if (newX - players[1].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
            newX + players[1].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
            players[1].mesh.position.x = newX;
        }
        if (socket && socket.readyState) {
            let cmd = "move";
            const movementData = { x: x2, y: 0 };
            socket.send(JSON.stringify({ cmd, movementData })); // Sending to gameserv/consumers.py 
        }
    }

    updatePlayerVisualization();
}



function moveBall(delta) {
    sphere.position.x += ballSpeedX * delta;
    sphere.position.y += ballSpeedY * delta;

    // Gérer les collisions avec les murs
    walls.forEach(wall => {
        const wallBox = new THREE.Box3().setFromObject(wall);
        const sphereBox = new THREE.Box3().setFromObject(sphere);

        if (wallBox.intersectsBox(sphereBox)) {
            if (wall === topWall || wall === bottomWall) {
                ballSpeedY = -ballSpeedY;
                // Ajuste légèrement la position de la balle pour éviter une collision wack
                if (wall === topWall) {
                    sphere.position.y = wallBox.min.y - sphere.geometry.parameters.radius - 0.01;
                } else {
                    sphere.position.y = wallBox.max.y + sphere.geometry.parameters.radius + 0.01;
                }
            } else if (wall === leftWall || wall === rightWall) {
                ballSpeedX = -ballSpeedX;
                // Ajuster légèrement la position de la balle pour éviter une collision wack
                if (wall === leftWall) {
                    sphere.position.x = wallBox.max.x + sphere.geometry.parameters.radius + 0.01;
                } else {
                    sphere.position.x = wallBox.min.x - sphere.geometry.parameters.radius - 0.01;
                }
            }
        }
    });

    // Gérer les collisions avec les joueurs
    players.forEach(player => {
        const playerBox = new THREE.Box3().setFromObject(player.mesh);
        const sphereBox = new THREE.Box3().setFromObject(sphere);

        if (playerBox.intersectsBox(sphereBox)) {
            // Vérifie la direction du mouvement de la balle pour ajuster correctement
            if (Math.abs(sphere.position.y - player.mesh.position.y) < player.mesh.geometry.parameters.height / 2) {
                // Collision sur les côtés horizontaux du joueur
                ballSpeedX = -ballSpeedX;
                if (ballSpeedX > 0) {
                    sphere.position.x = playerBox.max.x + sphere.geometry.parameters.radius + 0.01;
                } else {
                    sphere.position.x = playerBox.min.x - sphere.geometry.parameters.radius - 0.01;
                }
            } else {
                // Collision sur les côtés verticaux du joueur
                ballSpeedY = -ballSpeedY;
                if (ballSpeedY > 0) {
                    sphere.position.y = playerBox.max.y + sphere.geometry.parameters.radius + 0.01;
                } else {
                    sphere.position.y = playerBox.min.y - sphere.geometry.parameters.radius - 0.01;
                }
            }
        }
    });
}








export function animate() {
    requestAnimationFrame(animate);
    delta = clock.getDelta();
    // changes x and y of the mesh.
    movePlayer(delta);
    moveBall(delta);
    camera.position.set(0, -20, 15);
    camera.lookAt(0, 0, 0); 
    controls.update();
    renderer.render(scene, camera);
}


export function receiveMove(id, movementData) {
    const player = players.find(p => p.id === id);
    // console.log("Do find() work?:", player, players);
    // console.log("movementData: ",movementData);
    if (player) {
        if (movementData) {
            if (movementData.x) player.mesh.position.x += movementData.x;
            if (movementData.y) player.mesh.position.y += movementData.y;
        }
    } else {
        console.log("Player doesnt exist, creating one");
        if (!movementData.x) movementData.x = 0;
        players.push(new Player(id, movementData.x, movementData.y, 0)); 
        if (!movementData.y) movementData.y = 0;
    }
    updatePlayerVisualization();
}

export function receiveSync(id, movementData) {
    const player = players.find(p => p.id === id);
    // console.log("Do find() work?:", player, players);
    if (!player) {
        // console.log("Player doesnt exist, creating one");
        if (!movementData.x) movementData.x = 0;
        if (!movementData.y) movementData.y = 0;
        players.push(new Player(id, movementData.x, movementData.y, 0));
    }
    updatePlayerVisualization();
}

export function sendSync() {
    let cmd = "sync";
    let x = players[0].mesh.position.x;
    let y = players[0].mesh.position.y;
    const movementData = { x, y };
    socket.send(JSON.stringify({ cmd, movementData }));
}

function removeMeshFromScene(mesh, scene) {
    // Remove mesh from scene
    scene.remove(mesh);
    // Dispose geometry
    if (mesh.geometry) {
        mesh.geometry.dispose();
    }
    // Dispose material
    if (mesh.material) {
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(material => material.dispose());
        } else {
            mesh.material.dispose();
        }
    }
    // Dispose textures
    if (mesh.material.map) {
        mesh.material.map.dispose();
    }
    // Additional textures if any
    // if (mesh.material.normalMap) mesh.material.normalMap.dispose();
    // if (mesh.material.specularMap) mesh.material.specularMap.dispose();
    // etc...
}

animate();
