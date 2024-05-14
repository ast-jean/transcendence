import * as THREE from 'three';
import { socket } from './socket.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var clock = new THREE.Clock();

const container = document.getElementById('gameCont');
const width = container.clientWidth;
const height = container.clientWidth * 0.666;

// camera.position.z = 2;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

// camera.lookAt(0, 0, 0); 
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
renderer.setClearColor(0x000001);
// renderer.domElement.style.aspectRatio = 'auto 1 / 1';
container.appendChild(renderer.domElement);

var localplay = document.getElementById("localplay_btn");
localplay.addEventListener("click", localgame);


var index = 0;
function localgame () {
    //have fun!
    console.log("in localgame function", index);
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    // sphereMaterial.opacity = 0.5; 
    // sphereMaterial.transparent = true;
    const sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere2.position.set(index++, 0, 0);
    scene.add(sphere2);
    updatePlayerVisualization();
}

const controls = new OrbitControls(camera, renderer.domElement);

// Resize game window on window resize
// window.addEventListener('resize', onWindowResize, false);

// function onWindowResize() {
//     camera.aspect = width / height;
//     camera.updateProjectionMatrix();
//     renderer.setSize(width, height);
// }

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

export let players = [];

export function removePlayer(playerIdToRemove) {
    console.log("Removing player");
    let player = players.find(p => p.id === playerIdToRemove);
    removeMeshFromScene(player.mesh, scene);
    players = players.filter(player => player.id !== playerIdToRemove);
    updatePlayerVisualization();
}

let colors = [
    0x00ff00, // Green
    0xff0000, // Red
    0x0000ff, // Blue
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
    constructor(id, x, y) {
        this.id = id;

        let material = new THREE.MeshBasicMaterial({ color: colors[i++]});
        material.opacity = 0.5; 
        material.transparent = true;
        material.needsUpdate = true;
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.velocity = { x: 0, y: 0 };
        console.log('New player:', this);
    }
}
players.push(new Player(0,0,0));

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
    //ADD BALL MOVEMENT HERE STEVEN!!!!
}

export var delta;

var keyState = {};


document.addEventListener('keydown', function(e) {
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.code)) {
        keyState[e.code] = true;
        e.preventDefault(); // Prevent default here, for arrow keys.
    }
}, true);

document.addEventListener('keyup', function(e) {
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.code)) {
        keyState[e.code] = false;
        e.preventDefault(); // It's usually not necessary to prevent default on keyup, but it's here for consistency.
    }
}, true);

export function movePlayer(delta) {
    const speed = 10; // Adjust speed as necessary
    const deceleration = 0.92; // Deceleration factor
    let x = 0;
    let y = 0;

    if (keyState['ArrowLeft']) x -= speed * delta;
    if (keyState['ArrowRight']) x += speed * delta;
    if (keyState['ArrowUp']) y += speed * delta;
    if (keyState['ArrowDown']) y -= speed * delta;
    // Emit movement data to the server
        // Apply deceleration if no key is pressed
    if (!(keyState['ArrowLeft'] || keyState['ArrowRight'])) {
        x = players[0].velocity.x * deceleration;
    }
    if (!(keyState['ArrowUp'] || keyState['ArrowDown'])) {
        y = players[0].velocity.y * deceleration;
    }
    players[0].velocity.x = x;
    players[0].velocity.y = y;
    if (x !== 0 || y !== 0 ) //if both 0 = false
    {   
        if (socket && socket.readyState)
        {
            let cmd = "move";
            const movementData = { x, y };
            socket.send(JSON.stringify({ cmd , movementData })); //Sending to gameserv/consumers.py 
        }
        players[0].mesh.position.x += x;
        players[0].mesh.position.y += y;
    }
    updatePlayerVisualization();
}

export function animate() {
    requestAnimationFrame(animate);
    delta = clock.getDelta();
    //changes x and y of the mesh.
    movePlayer(delta);
    camera.position.set(0, 0, 5);
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
            if (movementData.x)
                player.mesh.position.x += movementData.x;
            if (movementData.y) 
                player.mesh.position.y += movementData.y;
        }
    } else {
        console.log("Player doesnt exist, creating one");
        if (!movementData.x)
            movementData.x = 0;
        players.push(new Player(id, movementData.x, movementData.y));
        if (!movementData.y)
            movementData.y = 0;
    }
    updatePlayerVisualization();
}

export function receiveSync(id, movementData) {
    const player = players.find(p => p.id === id);
    // console.log("Do find() work?:", player, players);
    if (!player) {
        // console.log("Player doesnt exist, creating one");
        if (!movementData.x)
            movementData.x = 0;
        if (!movementData.y)
        movementData.y = 0;
        players.push(new Player(id, movementData.x, movementData.y));
    }
    updatePlayerVisualization();
}

export function sendSync() {
    let cmd = "sync";
    let x = players[0].mesh.position.x;
    let y = players[0].mesh.position.y;
    const movementData = { x, y };
    socket.send(JSON.stringify({ cmd , movementData }));
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