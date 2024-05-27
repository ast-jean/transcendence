import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { socket } from './socket_truck.js'
// import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as CANNON from 'cannon';
import CannonDebugRenderer from './CannonDebugRenderer.js';

class TruckSimulation {
    constructor() {
        this.keyState = {};
        this.initThree();
        this.initCannon();
        this.loadTruckModel();
        this.addStaticPlane();
        this.debugRenderer = new CannonDebugRenderer(this.scene, this.world);
        this.initEventListeners();
        this.animate = this.animate.bind(this);
        this.animate();
    }

    initThree() {
        this.scene = new THREE.Scene();

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('gameCont').appendChild(this.renderer.domElement);

        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        const controls = new OrbitControls(this.camera, this.renderer.domElement);


    }

    initCannon() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Correct gravity vector

        const chassisShape = new CANNON.Box(new CANNON.Vec3(0.85, 0.5, 2));
        this.chassisBody = new CANNON.Body({ mass: 150 });
        this.chassisBody.addShape(chassisShape);
        this.chassisBody.position.set(0, 5, 0);
        this.world.addBody(this.chassisBody);

        const wheelOptions = {
            radius: 0.5,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionRestLength: 0.3,
            maxSuspensionForce: 100000,
            maxSuspensionTravel: 0.3,
            dampingRelaxation: 4.5,
            dampingCompression: 4.5,
            frictionSlip: 10.5,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
            indexRightAxis: 0,
            indexUpAxis: 1,
            indexForwardAxis: 2
        });

    // Adding wheels
    wheelOptions.chassisConnectionPointLocal.set(1, -1.5, -1); // Rear right
    this.vehicle.addWheel(wheelOptions);
    
    wheelOptions.chassisConnectionPointLocal.set(-1, -1.5, -1); // Rear left
    this.vehicle.addWheel(wheelOptions);
    wheelOptions.chassisConnectionPointLocal.set(1, -1.5, 1); // Front right
    this.vehicle.addWheel(wheelOptions);
    
    wheelOptions.chassisConnectionPointLocal.set(-1, -1.5, 1); // Front left

    this.vehicle.addWheel(wheelOptions);

    this.vehicle.addToWorld(this.world);

        this.wheelMeshes = [];
        this.vehicle.wheelInfos.forEach((wheel, index) => {
            const wheelGeometry = new THREE.CylinderGeometry(wheel.radius, wheel.radius, 0.4, 20);
            const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheelMesh.rotation.x = Math.PI / 2;
            this.scene.add(wheelMesh);
            this.wheelMeshes.push(wheelMesh);
    });
    }

    loadTruckModel() {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('/static/main/obj/truck.mtl', (materials) => {
            materials.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load('/static/main/obj/truck.obj', (mesh) => {
                this.truckMesh = mesh;
                this.truckMesh.scale.set(0.5, 0.5, 0.5);
                this.truckMesh.rotation.z = Math.PI;
                this.scene.add(this.truckMesh);
            });
        });
    }

    addStaticPlane() {
        const planeShape = new CANNON.Plane();
        const planeBody = new CANNON.Body({ mass: 0 });
        planeBody.addShape(planeShape);
        planeBody.position.set(0, 0, 0);
        planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(planeBody);

        const planeGeometry = new THREE.PlaneGeometry(200, 200);
        const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x888888, side: THREE.DoubleSide });
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        planeMesh.rotation.x = -Math.PI / 2;
        this.scene.add(planeMesh);
    }

    animate() {
        requestAnimationFrame(this.animate);

        this.world.step(1 / 60);

        if (this.truckMesh) {
            const offset = new THREE.Vector3(0, -0.8, 0); // Adjust Y value as needed
            this.truckMesh.position.add(offset);
            
            const relativeCameraOffset = new THREE.Vector3(0, 5, 10);
            const cameraOffset = relativeCameraOffset.applyMatrix4(this.truckMesh.matrixWorld);
            this.camera.position.lerp(cameraOffset, 0.1);
            this.camera.lookAt(this.truckMesh.position);
            
            const offsetBoth = new THREE.Vector3(0, -1, 0); // Adjust Y value as needed
            this.truckMesh.position.add(offsetBoth);
            // this.chassisBody.position.add(offsetBoth);
            this.truckMesh.position.copy(this.chassisBody.position);
            this.truckMesh.quaternion.copy(this.chassisBody.quaternion);
        }
        this.vehicle.wheelInfos.forEach((wheel, index) => {
            this.vehicle.updateWheelTransform(index);
            const t = wheel.worldTransform;
            this.wheelMeshes[index].position.copy(t.position);
            this.wheelMeshes[index].quaternion.copy(t.quaternion);
            this.wheelMeshes[index].rotation.z = Math.PI / 2;
        });
        this.handleKeyStates();
        this.debugRenderer.update(); // Update the debug renderer
        this.renderer.render(this.scene, this.camera);
    }

    initEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.code)) {
                this.keyState[e.code] = true;
                e.preventDefault();
            }
        }, true);
        document.addEventListener('keyup', (e) => {
            if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.code)) {
                this.keyState[e.code] = false;
                e.preventDefault();
            }
        }, true);
    }

    handleKeyStates() {
        const maxSteerVal = Math.PI / 8;
        const maxForce = 1000;

        if (this.keyState['ArrowUp']) {
            console.log("UP");
            this.vehicle.applyEngineForce(maxForce, 2);
            this.vehicle.applyEngineForce(maxForce, 3);
        } else if (this.keyState['ArrowDown']) {
            console.log("DOWN");
            this.vehicle.applyEngineForce(-maxForce, 2);
            this.vehicle.applyEngineForce(-maxForce, 3);
        } else {
            this.vehicle.applyEngineForce(0, 2);
            this.vehicle.applyEngineForce(0, 3);
        }

        if (this.keyState['ArrowLeft']) {
            console.log("LEFT");
            this.vehicle.setSteeringValue(maxSteerVal, 0);
            this.vehicle.setSteeringValue(maxSteerVal, 1);
        } else if (this.keyState['ArrowRight']) {
            console.log("RIGHT");
            this.vehicle.setSteeringValue(-maxSteerVal, 0);
            this.vehicle.setSteeringValue(-maxSteerVal, 1);
        } else {
            this.vehicle.setSteeringValue(0, 0);
            this.vehicle.setSteeringValue(0, 1);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TruckSimulation();
});




// //XXXXX_X_X_X_X_X_XX_X_X_X_X_X_X_X_X_X_X_X_X_X_XX_X_X_X_X_X_X_X_X_X_X
// var clock = new THREE.Clock();
// let colors = [
//     0x00ff00, // Green
//     0xff0000, // Red
//     0x0000ff, // Blue
//     0xffff00, // Yellow
//     0x00ffff, // Cyan
//     0xff00ff, // Magenta
//     0xffa500, // Orange
//     0x800080, // Purple
//     0x008080, // Teal
//     0x808000  // Olive
// ];
//  let i = 0;
export let players = [];
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

// const container = document.getElementById('gameCont');
// const width = container.clientWidth;
// const height = container.clientWidth * 0.666;

// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
// players.push(new Player(5,0,5));
// // camera.lookAt(players[0].mesh.position); 
// camera.position.set(0, 5, -5);

// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(width, height);
// renderer.setClearColor(0x000001);
// // renderer.domElement.style.aspectRatio = 'auto 1 / 1';
// container.appendChild(renderer.domElement);


// // Add a basic plane to the scene
// const planeGeometry = new THREE.PlaneGeometry(10, 10);
// const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x62958E, side: THREE.DoubleSide });
// const plane = new THREE.Mesh(planeGeometry, planeMaterial);
// plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
// plane.position.y = -1; // Position it just below the origin
// scene.add(plane);




// // Resize game window on window resize
// // window.addEventListener('resize', onWindowResize, false);

// // function onWindowResize() {
// //     camera.aspect = width / height;
// //     camera.updateProjectionMatrix();
// //     renderer.setSize(width, height);
// // }

// // function resizeRendererToDisplaySize(renderer) {
// //     const canvas = renderer.domElement;
// //     const width = canvas.clientWidth;
// //     const height = canvas.clientWidth;
// //     const needResize = canvas.width !== width || canvas.height !== height;
// //     if (needResize) {
// //       renderer.setSize(width, height, false);
// //     }
// //     return needResize;
// // }


export function removePlayer(playerIdToRemove) {
    console.log("Removing player");
    let player = players.find(p => p.id === playerIdToRemove);
    removeMeshFromScene(player.mesh, scene);
    players = players.filter(player => player.id !== playerIdToRemove);
    updatePlayerVisualization();
}




// // Create a sphere geometry
// // The parameters are: radius, widthSegments, heightSegments
// const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
// const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
// // sphereMaterial.opacity = 0.5; 
// // sphereMaterial.transparent = true;
// const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
// sphere.position.set(0, 0, 0);
// scene.add(sphere);




// // If using lights and a material that reacts to light
// const light = new THREE.PointLight(0xffffff, 1, 100);
// light.position.set(0, 10, 5);
// scene.add(light);

// const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Color and intensity
// scene.add(ambientLight);

export function updatePlayerVisualization() {
    // if (players.length > 0) {
    //         players.forEach(player => {
    //                 scene.add(player.mesh);
    //         });
    // }
}

export var delta;



export function movePlayer(delta) {
    const speed = 10; // Adjust speed as necessary
    const deceleration = 0.92; // Deceleration factor
    let x = 0;
    let z = 0;

    if (keyState['ArrowLeft']) {

    }
    if (keyState['ArrowRight']) {

    }
    if (keyState['ArrowUp']) {
        
    } if (keyState['ArrowDown']) {

    }
    // Emit movement data to the server
        // Apply deceleration if no key is pressed
    // if (!(keyState['ArrowLeft'] || keyState['ArrowRight'])) {
    //     x = players[0].velocity.x * deceleration;
    // }
    // if (!(keyState['ArrowUp'] || keyState['ArrowDown'])) {
    //     z = players[0].velocity.z * deceleration;
    // // }
    // players[0].velocity.x = x;
    // players[0].velocity.z = z;


    // //Send new position to server players[]
    // if (x !== 0 || z !== 0 ) //if both 0 = false
    // {   
    //     if (socket && socket.readyState)
    //     {
    //         let cmd = "move";
    //         const movementData = { x, z };
    //         socket.send(JSON.stringify({ cmd , movementData })); //Sending to gameserv/consumers.py 
    //     }
    //     players[0].mesh.position.x += x;
    //     players[0].mesh.position.z += z;
    // }
    updatePlayerVisualization();
}

// export function animate() {
//     requestAnimationFrame(animate);
//     delta = clock.getDelta();
//     //changes x and z of the mesh.
//     movePlayer(delta);
//     // console.log(players[0].mesh.position);
//     // camera.position.set(0 + players[0].mesh.position.x, 5, -5 + players[0].mesh.position.z);
//     if (players[0].mesh) {
//         camera.lookAt(players[0].mesh.position);
//     }
//     // controls.update(); //for orbit controls
//     renderer.render(scene, camera);
// }

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

// function removeMeshFromScene(mesh, scene) {
//     // Remove mesh from scene
//     scene.remove(mesh);
//     // Dispose geometry
//     if (mesh.geometry) {
//         mesh.geometry.dispose();
//     }
//     // Dispose material
//     if (mesh.material) {
//         if (Array.isArray(mesh.material)) {
//             mesh.material.forEach(material => material.dispose());
//         } else {
//             mesh.material.dispose();
//         }
//     }
//     // Dispose textures
//     if (mesh.material.map) {
//         mesh.material.map.dispose();
//     }
//     // Additional textures if any
//     // if (mesh.material.normalMap) mesh.material.normalMap.dispose();
//     // if (mesh.material.specularMap) mesh.material.specularMap.dispose();
//     // etc...
// }

// animate();