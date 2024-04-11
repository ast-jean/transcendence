import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { socket , players} from './socket.js';

const canvasContainer = document.querySelector('#game');
var clock = new THREE.Clock();
var keyState = {};
// var otherPlayerObjects = {}; // Keep track of other players' objects

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

camera.position.z = 15;
// // Add directional light to the scene for better visualization
// var light = new THREE.DirectionalLight(0xff00ff);
// scene.add(light);
// light.position.set(0, 1, 1).normalize();


// Remove all existing player cubes from the scene
function refreshScene(){
    scene.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
            scene.remove(child);
        }
    });
}

export function updatePlayerVisualization() {
    refreshScene();
    // Loop through players and create cubes with different colors
    // console.log("updatePlayersViz players:", players);
    players.forEach(player => {
        scene.add(player.mesh);
    });
}

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


function movePlayer(delta) {
    const speed = 10; // Adjust speed as necessary
    let x = 0;
    let y = 0;

    if (keyState['ArrowLeft']) x -= speed * delta;
    if (keyState['ArrowRight']) x += speed * delta;
    if (keyState['ArrowUp']) y += speed * delta;
    if (keyState['ArrowDown']) y -= speed * delta;
    // Emit movement data to the server
    const movementData = { x, y };
    // socket.emit('sendPositionToServer', movementData);
    if (x !== 0 || y !== 0 ) //if both 0 = false
    {   
        players[0].mesh.position.x += x;
        players[0].mesh.position.y += y;
    }

}

export function animate() {
    requestAnimationFrame(animate);
    var delta = clock.getDelta();

    //changes x and y of the mesh.
    movePlayer(delta);
    updatePlayerVisualization();
    renderer.render(scene, camera);
}

