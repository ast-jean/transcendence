import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { socket } from './socket.js'
// import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


var clock = new THREE.Clock();
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
    constructor(id, x, z) {
        this.id = id;
        this.velocity = { x: 0, z: 0 };

        // Assuming colors and i are defined somewhere in your code that makes them accessible here.
        // let material = new THREE.MeshBasicMaterial({ color: colors[i++] });
        // material.opacity = 0.5;
        // material.transparent = true;
        // material.needsUpdate = true;
        const mtlLoader = new MTLLoader();
        mtlLoader.load(
            '/static/main/obj/truck.mtl', // Path to your MTL file
            (materials) => {
                
                materials.preload();

                const objLoader = new OBJLoader();
                objLoader.setMaterials(materials); // Apply the materials to the OBJ loader
                objLoader.load(
                    '/static/main/obj/truck.obj', // Path to your OBJ file
                    (root) => {
                        this.mesh = root;
                        this.mesh.position.set(x, 0, z);
                        this.mesh.scale.set(0.5, 0.5, 0.5); // Scale the model

                        // Rotate the mesh 180 degrees around the Y-axis
                        this.mesh.rotation.y = Math.PI;

                        // Add the loaded mesh to the scene
                        scene.add(this.mesh);

                        // Log the new player creation after the mesh has been set up
                        console.log('New player:', this);
                    },
                    (xhr) => {
                        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
                    },
                    (error) => {
                        console.log('An error happened during loading:', error);
                    }
                );
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            },
            (error) => {
                console.log('An error happened during loading MTL:', error);
            }
        );
    }
}
// export class Player {
//     constructor(id, x, z) {
//         this.id = id;

//         let material = new THREE.MeshBasicMaterial({ color: colors[i++]});
//         material.opacity = 0.5; 
//         material.transparent = true;
//         material.needsUpdate = true;

//         const objLoader = new THREE.OBJLoader();
//         objLoader.load('jeep.obj', (root) => {
//             this.mesh = root;
//             this.mesh.position.x = x;
//             this.mesh.position.z = z;
//             this.mesh.material = material; // Apply the material to the loaded OBJ model

//             // Log the new player creation after the mesh has been set up
//             console.log('New player:', this);
//         }, (xhr) => {
//             console.log((xhr.loaded / xhr.total * 100) + '% loaded');
//         }, (error) => {
//             console.log('An error happened during loading:', error);
//         });
//     }
// }
const container = document.getElementById('gameCont');
const width = container.clientWidth;
const height = container.clientWidth * 0.666;
export let players = [];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
players.push(new Player(5,0,5));
// camera.lookAt(players[0].mesh.position); 
camera.position.set(0, 5, -5);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
renderer.setClearColor(0x000001);
// renderer.domElement.style.aspectRatio = 'auto 1 / 1';
container.appendChild(renderer.domElement);

var localplay = document.getElementById("localplay_btn");
localplay.addEventListener("click", localgame);


// Add a basic plane to the scene
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x62958E, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
plane.position.y = -1; // Position it just below the origin
scene.add(plane);


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

// const controls = new OrbitControls(camera, renderer.domElement);

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


export function removePlayer(playerIdToRemove) {
    console.log("Removing player");
    let player = players.find(p => p.id === playerIdToRemove);
    removeMeshFromScene(player.mesh, scene);
    players = players.filter(player => player.id !== playerIdToRemove);
    updatePlayerVisualization();
}




// Create a sphere geometry
// The parameters are: radius, widthSegments, heightSegments
const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
// sphereMaterial.opacity = 0.5; 
// sphereMaterial.transparent = true;
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0, 0, 0);
scene.add(sphere);

// import { GUI } from 'dat.gui' //Needs the dat.gui library
// const gui = new GUI()
// const physicsFolder = gui.addFolder('Physics')
// physicsFolder.add(players[0].position,x, 'x', -10.0, 10.0, 0.1)
// physicsFolder.add(players[0].position,y, 'y', -100.0, 10.0, 0.1)
// physicsFolder.add(players[0].position,z, 'z', -10.0, 10.0, 0.1)
// physicsFolder.open()


// If using lights and a material that reacts to light
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(0, 10, 5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Color and intensity
scene.add(ambientLight);

export function updatePlayerVisualization() {
    // if (players.length > 0) {
    //         players.forEach(player => {
    //                 scene.add(player.mesh);
    //         });
    // }
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
    let z = 0;

    if (keyState['ArrowLeft']) x += speed * delta;
    if (keyState['ArrowRight']) x -= speed * delta;
    if (keyState['ArrowUp']) z += speed * delta;
    if (keyState['ArrowDown']) z -= speed * delta;
    // Emit movement data to the server
        // Apply deceleration if no key is pressed
    if (!(keyState['ArrowLeft'] || keyState['ArrowRight'])) {
        x = players[0].velocity.x * deceleration;
    }
    if (!(keyState['ArrowUp'] || keyState['ArrowDown'])) {
        z = players[0].velocity.z * deceleration;
    }
    players[0].velocity.x = x;
    players[0].velocity.z = z;
    if (x !== 0 || z !== 0 ) //if both 0 = false
    {   
        if (socket && socket.readyState)
        {
            let cmd = "move";
            const movementData = { x, z };
            socket.send(JSON.stringify({ cmd , movementData })); //Sending to gameserv/consumers.py 
        }
        players[0].mesh.position.x += x;
        players[0].mesh.position.z += z;
    }
    updatePlayerVisualization();
}

export function animate() {
    requestAnimationFrame(animate);
    delta = clock.getDelta();
    //changes x and z of the mesh.
    movePlayer(delta);
    // console.log(players[0].mesh.position);
    // camera.position.set(0 + players[0].mesh.position.x, 5, -5 + players[0].mesh.position.z);
    if (players[0].mesh) {
        camera.lookAt(players[0].mesh.position);
    }
    // controls.update(); //for orbit controls
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
            if (movementData.z) 
                player.mesh.position.z += movementData.z;
        }
    } else {
        console.log("Player doesnt exist, creating one");
        if (!movementData.x)
            movementData.x = 0;
        players.push(new Player(id, movementData.x, movementData.z));
        if (!movementData.z)
            movementData.z = 0;
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
        if (!movementData.z)
        movementData.z = 0;
        players.push(new Player(id, movementData.x, movementData.z));
    }
    updatePlayerVisualization();
}

export function sendSync() {
    let cmd = "sync";
    let x = players[0].mesh.position.x;
    let z = players[0].mesh.position.z;
    const movementData = { x, z };
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