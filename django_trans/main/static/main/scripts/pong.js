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

let ballSpeedX = 10
let ballSpeedY = 10

// Créer les murs
const wallThickness = 0.5;
const wallLength = 20;
const walls = [];
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); 

// Mur du fond
const topWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallLength, wallThickness, 1),
    wallMaterial
);
topWall.position.set(0, wallLength / 2, 0);
scene.add(topWall);
walls.push(topWall);

// Mur du bas
const bottomWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallLength, wallThickness, 1),
    wallMaterial
);
bottomWall.position.set(0, -wallLength / 2, 0);
scene.add(bottomWall);
walls.push(bottomWall);

// Mur de gauche
const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallLength, 1),
    wallMaterial
);
leftWall.position.set(-wallLength / 2, 0, 0);
scene.add(leftWall);
walls.push(leftWall);

// Mur de droite
const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallLength, 1),
    wallMaterial
);
rightWall.position.set(wallLength / 2, 0, 0);
scene.add(rightWall);
walls.push(rightWall);

var index = 0;
function localgame() {
    // have fun!
    console.log("in localgame function", index);

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

let player1Score = 0;
let player2Score = 0;

const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');

function updateScore(player) {
    if (player === 1) {
        player1Score++;
        player1ScoreElement.textContent = player1Score;
    } else if (player === 2) {
        player2Score++;
        player2ScoreElement.textContent = player2Score;
    }
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
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0, 0, 0);
scene.add(sphere);

// If using lights and a material that reacts to light
// Augmenter l'intensité des lumières
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(0, 20, 10);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1);
fillLight.position.set(-10, 10, 10);
scene.add(fillLight);

// Lumière ambiante pour ajouter une illumination générale
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Lumière ponctuelle près de la balle
const ballLight = new THREE.PointLight(0xffffff, 1.5, 50);
ballLight.position.set(0, 0, 5);
scene.add(ballLight);






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
    let ballPosition = new THREE.Vector2(sphere.position.x, sphere.position.y);
    let ballSpeed = new THREE.Vector2(ballSpeedX, ballSpeedY);

    let newPosition = ballPosition.clone().add(ballSpeed.clone().multiplyScalar(delta));

    function handleCollision(axis, wallBox) {
        ballSpeed[axis] *= -1;
        if (axis === 'x') {
            if (ballSpeed.x > 0) {
                newPosition.x = wallBox.max.x + sphere.geometry.parameters.radius + 0.01;
            } else {
                newPosition.x = wallBox.min.x - sphere.geometry.parameters.radius - 0.01;
            }
        } else if (axis === 'y') {
            if (ballSpeed.y > 0) {
                newPosition.y = wallBox.max.y + sphere.geometry.parameters.radius + 0.01;
            } else {
                newPosition.y = wallBox.min.y - sphere.geometry.parameters.radius + 0.01;
            }
        }
    }
    
    // Gérer les collisions avec les murs
    let scored = false;
    walls.forEach(wall => {
        const wallBox = new THREE.Box3().setFromObject(wall);
        const sphereBox = new THREE.Box3().setFromObject(sphere);

        if (wallBox.intersectsBox(sphereBox)) {
            if (wall === topWall)
            {
                updateScore(1);
                scored = true;
            }
            else if (wall === bottomWall) {
                updateScore(2);
                scored = true;
                
            } else if (wall === leftWall || wall === rightWall) {
                handleCollision('x', wallBox);
            }
        }
        if (!scored) {
            sphere.position.set(newPosition.x, newPosition.y);
        } else {
            // Réinitialiser la position de la balle après un point
            sphere.position.set(0, 0, 0);
            ballSpeed.set(5 * (Math.random() > 0.5 ? 1 : -1), 5 * (Math.random() > 0.5 ? 1 : -1));
            ballSpeedX = ballSpeed.x;
            ballSpeedY = ballSpeed.y;
        }

    });


    // Gérer les collisions avec les joueurs
    const speedIncreaseFactor = 1.1; // Facteur d'augmentation de la vitesse

    players.forEach(player => {
        const playerBox = new THREE.Box3().setFromObject(player.mesh);
        const sphereBox = new THREE.Box3().setFromObject(sphere);
    
        if (playerBox.intersectsBox(sphereBox)) {
            let relativeIntersectY = (newPosition.y - player.mesh.position.y) / (player.mesh.geometry.parameters.height / 2);
            let bounceAngle = relativeIntersectY * (Math.PI / 8);
    
            let speed = ballSpeed.length();
            if (newPosition.x > player.mesh.position.x) {
                ballSpeed.set(Math.abs(speed * Math.cos(bounceAngle)), speed * Math.sin(bounceAngle));
            } else {
                ballSpeed.set(-Math.abs(speed * Math.cos(bounceAngle)), speed * Math.sin(bounceAngle));
            }
    
            if (Math.abs(ballSpeed.x) < speed * 0.5) {
                ballSpeed.x = Math.sign(ballSpeed.x) * speed * 0.5;
            }
    
            ballSpeed.normalize().multiplyScalar(speed);
    
            // Augmenter la vitesse de la balle
            ballSpeed.multiplyScalar(speedIncreaseFactor);
        }
    });
    




    ballSpeedX = ballSpeed.x;
    ballSpeedY = ballSpeed.y;
}























export function animate() {
    requestAnimationFrame(animate);
    delta = clock.getDelta();
    // changes x and y of the mesh.
    movePlayer(delta);
    moveBall(delta);
    camera.position.set(0, -15, 10);
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
