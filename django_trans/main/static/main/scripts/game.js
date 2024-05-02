import * as THREE from 'three';
import { socket , players} from './socket.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var clock = new THREE.Clock();



const canvas = document.getElementById('game');
const scene = new THREE.Scene();

const fov = 75;
const aspect = 2;
const near = 0.1;
const far = 5;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// camera.position.z = 2;
camera.position.z = 15;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
const controls = new OrbitControls(camera, renderer.domElement);
document.body.appendChild(renderer.domElement);

// Resize game window on window resize
window.addEventListener('resize', onWindowResize, false);


function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
}

// Add directional light to the scene for better visualization






//!!!!Let there be light!!!! for phong material
// var light = new THREE.DirectionalLight(0xffffff);
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
    // if (resizeRendererToDisplaySize(renderer)) {
    //     const canvas = renderer.domElement;
    //     camera.aspect = canvas.clientWidth / canvas.clientHeight;
    //     camera.updateProjectionMatrix();
    // }
    // Loop through players and create cubes with different colors
    // console.log("updatePlayersViz players:", players);
    // console.log("players length", players.length);
    // if (players.length > 0)
    // {
        //     players.forEach(player => {
            //         scene.add(player.mesh);
            //     });
            // }
        // refreshScene();
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
    delta = clock.getDelta();

    //changes x and y of the mesh.
    movePlayer(delta);
    updatePlayerVisualization();

    renderer.render(scene, camera);
}
function onWindowResize(){
    camera.aspect = document.getElementById('game').clientWidth / document.getElementById('game').clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(document.getElementById('game').clientWidth, document.getElementById('game').clientHeight);
}

animate();