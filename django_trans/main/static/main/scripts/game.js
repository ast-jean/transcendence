import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { socket , players} from './socket.js';

var clock = new THREE.Clock();
var keyState = {};
// var otherPlayerObjects = {}; // Keep track of other players' objects

const scene = new THREE.Scene();

const canvas = document.getElementById('game');
if (!canvas) {
    console.error('Failed to find the canvas element');
} else {
    const renderer = new THREE.WebGLRenderer({ canvas });
    // Continue with setting up your scene, camera, etc.
}

const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;


// const renderer = new THREE.WebGLRenderer();
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
document.body.appendChild(renderer.domElement);


// const aspectRatio = .2;
// const camera = new THREE.PerspectiveCamera(
//     75,       // Field of view
//     aspectRatio, // Aspect ratio, replaced with the container's aspect ratio
//     0.1,      // Near clipping plane
//     1000      // Far clipping plane
// );

// Resize game window on window resize
window.addEventListener('resize', onWindowResize, false);
function onWindowResize(){
    camera.aspect = document.getElementById('game').clientWidth / document.getElementById('game').clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(document.getElementById('game').clientWidth, document.getElementById('game').clientHeight);
}

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



const controls = new OrbitControls(camera, renderer.domElement);

camera.position.z = 15;
// Add directional light to the scene for better visualization

var light = new THREE.DirectionalLight(0xffffff);
scene.add(light);
light.position.set(0, 1, 1).normalize();


// Remove all existing player cubes from the scene
function refreshScene(){
    scene.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
            scene.remove(child);
        }
    });
}

export function updatePlayerVisualization() {
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
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

animate();