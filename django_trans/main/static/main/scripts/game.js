import * as THREE from 'three';
import { socket } from './socket.js';
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
class Player {
    constructor(id, x, y) {
        this.id = id;

        let material = new THREE.MeshBasicMaterial({  color: 0x00ffff });
        // let material = new THREE.MeshBasicMaterial({ color: colors[i++]});
        material.opacity = 0.5; 
        material.transparent = true;
        material.needsUpdate = true;
        
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
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

    //changes x and y of the mesh.ß
    movePlayer(delta);
    updatePlayerVisualization();
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    controls.update();
    renderer.render(scene, camera);
}


animate();