import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { socket } from './socket_truck.js'

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as CANNON from 'cannon';
import CannonDebugRenderer from './CannonDebugRenderer.js';

let score = {team1: 0, team2: 0}
let team1 = [];
let team2 = [];

class TruckSimulation {
    constructor() {
        this.keyState = {};
        this.players = []; 
        this.localplayer;
        this.initEventListeners();
        this.handleKeyStates();
        this.initThree(); 
        this.initCannon();
        this.addStaticPlane();
        this.addWalls();
        this.addRoof();
        this.addBall();
        this.resetPerformed = false; 
        this.debugRenderer = new CannonDebugRenderer(this.scene, this.world);
        this.animate = this.animate.bind(this);
        this.animate();
        this.initlocalplayer = false;
    }


    

    initThree() {
        // Three.js initialization code...
        this.scene = new THREE.Scene();
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
        
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('gameCont').appendChild(this.renderer.domElement);
       
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, -10, 10);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.up.set(0, 0, 1); 
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
    }

    initCannon() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, 0, -9.82); // Correct gravity vector

        // Create default contact material for the world
        const defaultMaterial = new CANNON.Material('defaultMaterial');
        this.world.defaultContactMaterial = new CANNON.ContactMaterial(
            defaultMaterial,
            defaultMaterial,
            {
                friction: 0.1,
                restitution: 0.9,
            }
        );
        this.world.addContactMaterial(this.world.defaultContactMaterial);

        this.addPlayer(0,10,0); //initial emplacement
    }

    addStaticPlane() {
        // Create the plane body
        const planeShape = new CANNON.Plane();
        const planeBody = new CANNON.Body({ mass: 0, material: this.planeMaterial });
        planeBody.addShape(planeShape);
        planeBody.position.set(0, 0, 0);
        planeBody.quaternion.setFromEuler(0, 0, -Math.PI / 2);
        this.world.addBody(planeBody);

        // Create the Three.js plane mesh for visualization
        const planeGeometry = new THREE.PlaneGeometry(200, 200);
        const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x888888, side: THREE.DoubleSide });
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        this.scene.add(planeMesh);
    }

    updateScore(){
        const team1ScoreElement = document.querySelector('.score_text_team1');
        const team2ScoreElement = document.querySelector('.score_text_team2');
    
        // Update the score elements with the new scores
        if (team1ScoreElement) {
            team1ScoreElement.textContent = score.team1;
        }
        if (team2ScoreElement) {
            team2ScoreElement.textContent = score.team2;
        }
    }

    resetMomentum(body) {
        // Reset linear velocity
        body.velocity.set(0, 0, 0);
        // Reset angular velocity
        body.angularVelocity.set(0, 0, 0);
    }
    
    addWalls() {
        // Define wall material
        const wallMaterial = new CANNON.Material('wallMaterial');
    
        // Create wall shapes and bodies in Cannon.js
        const wallShape1Left = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
        const wallBody1Left = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody1Left.addShape(wallShape1Left);
        wallBody1Left.position.set(-17, -37.5, 0);
        this.world.addBody(wallBody1Left);
    
        const wallShape1Right = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
        const wallBody1Right = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody1Right.addShape(wallShape1Right);
        wallBody1Right.position.set(17, -37.5, 0);
        this.world.addBody(wallBody1Right);
    
        const wallShape1Top = new CANNON.Box(new CANNON.Vec3(10, 1, 1));
        const wallBody1Top = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody1Top.addShape(wallShape1Top);
        wallBody1Top.position.set(0, -37.5, 9);
        this.world.addBody(wallBody1Top);


        const wallShape2Left = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
        const wallBody2Left = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody2Left.addShape(wallShape2Left);
        wallBody2Left.position.set(-17, 37.5, 0);
        this.world.addBody(wallBody2Left);
    
        const wallShape2Right = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
        const wallBody2Right = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody2Right.addShape(wallShape2Right);
        wallBody2Right.position.set(17, 37.5, 0);
        this.world.addBody(wallBody2Right);
    
        const wallShape2Top = new CANNON.Box(new CANNON.Vec3(10, 1, 1));
        const wallBody2Top = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody2Top.addShape(wallShape2Top);
        wallBody2Top.position.set(0, 37.5, 9);
        this.world.addBody(wallBody2Top);

        const wallShape3 = new CANNON.Box(new CANNON.Vec3(1, 50, 10));
        const wallBody3 = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody3.addShape(wallShape3);
        wallBody3.position.set(-25, 0, 0);
        this.world.addBody(wallBody3);
    
        const wallShape4 = new CANNON.Box(new CANNON.Vec3(1, 50, 10));
        const wallBody4 = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody4.addShape(wallShape4);
        wallBody4.position.set(25, 0, 0);
        this.world.addBody(wallBody4);
    
        // Add corner walls
        const cornerWallShape = new CANNON.Box(new CANNON.Vec3(1, 10, 10));
    
        const cornerWallBody1 = new CANNON.Body({ mass: 0, material: wallMaterial });
        cornerWallBody1.addShape(cornerWallShape);
        cornerWallBody1.position.set(-25, -30, 0);
        cornerWallBody1.quaternion.setFromEuler(0, 0, Math.PI / 4); // 45 degrees
        this.world.addBody(cornerWallBody1);
    
        const cornerWallBody2 = new CANNON.Body({ mass: 0, material: wallMaterial });
        cornerWallBody2.addShape(cornerWallShape);
        cornerWallBody2.position.set(25, -30, 0);
        cornerWallBody2.quaternion.setFromEuler(0, 0, -Math.PI / 4); // -45 degrees
        this.world.addBody(cornerWallBody2);
    
        const cornerWallBody3 = new CANNON.Body({ mass: 0, material: wallMaterial });
        cornerWallBody3.addShape(cornerWallShape);
        cornerWallBody3.position.set(-25, 30, 0);
        cornerWallBody3.quaternion.setFromEuler(0, 0, -Math.PI / 4); // -45 degrees
        this.world.addBody(cornerWallBody3);
    
        const cornerWallBody4 = new CANNON.Body({ mass: 0, material: wallMaterial });
        cornerWallBody4.addShape(cornerWallShape);
        cornerWallBody4.position.set(25, 30, 0);
        cornerWallBody4.quaternion.setFromEuler(0, 0, Math.PI / 4); // 45 degrees
        this.world.addBody(cornerWallBody4);
    
        // Create Three.js materials for visualization
        const wallMaterial1 = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red
        const wallMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green
        const wallMaterial3 = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue
        const wallMaterial4 = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow
        const cornerWallMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Purple
    
        // Create corresponding Three.js meshes for visualization
        const wallGeometry1 = new THREE.BoxGeometry(20, 2, 20);
        const wallGeometryTop = new THREE.BoxGeometry(20, 2, 2);
        const wallMesh1Left = new THREE.Mesh(wallGeometry1, wallMaterial1);
        wallMesh1Left.position.copy(wallBody1Left.position);
        this.scene.add(wallMesh1Left);
    
        const wallMesh1Right = new THREE.Mesh(wallGeometry1, wallMaterial1);
        wallMesh1Right.position.copy(wallBody1Right.position);
        this.scene.add(wallMesh1Right);
    
        const wallMesh1Top = new THREE.Mesh(wallGeometryTop, wallMaterial1);
        wallMesh1Top.position.copy(wallBody1Top.position);
        this.scene.add(wallMesh1Top);

        const wallMesh2Left = new THREE.Mesh(wallGeometry1, wallMaterial2);
        wallMesh2Left.position.copy(wallBody2Left.position);
        this.scene.add(wallMesh2Left);
    
        const wallMesh2Right = new THREE.Mesh(wallGeometry1, wallMaterial2);
        wallMesh2Right.position.copy(wallBody2Right.position);
        this.scene.add(wallMesh2Right);
    
        const wallMesh2Top = new THREE.Mesh(wallGeometryTop, wallMaterial2);
        wallMesh2Top.position.copy(wallBody2Top.position);
        this.scene.add(wallMesh2Top);

        const wallGeometry3 = new THREE.BoxGeometry(2, 100, 20);
        const wallMesh3 = new THREE.Mesh(wallGeometry3, wallMaterial3);
        wallMesh3.position.copy(wallBody3.position);
        this.scene.add(wallMesh3);
    
        const wallMesh4 = new THREE.Mesh(wallGeometry3, wallMaterial4);
        wallMesh4.position.copy(wallBody4.position);
        this.scene.add(wallMesh4);
    
        // Create corner wall meshes
        const cornerWallGeometry = new THREE.BoxGeometry(2, 20, 20);
        const cornerWallMesh1 = new THREE.Mesh(cornerWallGeometry, cornerWallMaterial);
        cornerWallMesh1.position.copy(cornerWallBody1.position);
        cornerWallMesh1.quaternion.copy(cornerWallBody1.quaternion);
        this.scene.add(cornerWallMesh1);
    
        const cornerWallMesh2 = new THREE.Mesh(cornerWallGeometry, cornerWallMaterial);
        cornerWallMesh2.position.copy(cornerWallBody2.position);
        cornerWallMesh2.quaternion.copy(cornerWallBody2.quaternion);
        this.scene.add(cornerWallMesh2);
    
        const cornerWallMesh3 = new THREE.Mesh(cornerWallGeometry, cornerWallMaterial);
        cornerWallMesh3.position.copy(cornerWallBody3.position);
        cornerWallMesh3.quaternion.copy(cornerWallBody3.quaternion);
        this.scene.add(cornerWallMesh3);
    
        const cornerWallMesh4 = new THREE.Mesh(cornerWallGeometry, cornerWallMaterial);
        cornerWallMesh4.position.copy(cornerWallBody4.position);
        cornerWallMesh4.quaternion.copy(cornerWallBody4.quaternion);
        this.scene.add(cornerWallMesh4);
    }
    
    addRoof() {
        // Define roof material
        const roofMaterial = new CANNON.Material('roofMaterial');
    
        // Create roof shape and body
        const roofShape = new CANNON.Box(new CANNON.Vec3(50, 50, 1)); // Dimensions of the roof
        const roofBody = new CANNON.Body({ mass: 0, material: roofMaterial });
        roofBody.addShape(roofShape);
        roofBody.position.set(0, 0, 11); // Position the roof above the scene
    
        // Add the roof body to the world
        this.world.addBody(roofBody);
    }

    addBall() {
        // Create a bouncy ball
        const ballRadius = 1; // Adjust the radius as needed
        const ballShape = new CANNON.Sphere(ballRadius);
        const ballMaterial = new CANNON.Material();
        const ballBody = new CANNON.Body({
            mass: 2, // Adjust mass as needed
            shape: ballShape,
            material: ballMaterial
        });
    
        ballBody.position.set(0, 5, 5); // Position the ball above the ground
        this.world.addBody(ballBody);
    
        // Add the ball mesh for visualization
        const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
        const ballMaterialVisual = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const ballMesh = new THREE.Mesh(ballGeometry, ballMaterialVisual);
        this.scene.add(ballMesh);
    
        this.ballMesh = ballMesh;
        this.ballBody = ballBody;
    }

    addPlayer(x, y, z) {
        const player = new Player(this.world, this.scene, x, y, z, this.carMaterial);
        this.players.push(player);
        return player;
    }

    movePlayer(index, force, steering) {
        const player = this.players[index];
        player.setEngineForce(force);
        player.setSteeringValue(steering);
    }

    update() {
        // if (this.players[0]) {
        //     const player = this.players[0];
        //     const chassisBody = player.chassisBody;
        //     // Camera offset relative to the vehicle
        //     const relativeCameraOffset = new THREE.Vector3(0, 10, 5);
        //     // Apply the vehicle's orientation to the offset
        //     const cameraOffset = relativeCameraOffset.clone().applyQuaternion(new THREE.Quaternion(
        //         chassisBody.quaternion.x, chassisBody.quaternion.y, chassisBody.quaternion.z, chassisBody.quaternion.w
        //     )).add(new THREE.Vector3(chassisBody.position.x, chassisBody.position.y, chassisBody.position.z));    
        //     // Smoothly move the camera to the new position
        //     this.camera.position.lerp(cameraOffset, 0.1);
        //     // Make the camera look at the vehicle
        //     this.camera.lookAt(new THREE.Vector3(chassisBody.position.x, chassisBody.position.y, chassisBody.position.z));
        //     // Sync chassis body position and quaternion with the vehicle (if needed)
        //     player.chassisBody.position.copy(chassisBody.position);
        //     player.chassisBody.quaternion.copy(chassisBody.quaternion);
        // }
        
        // Update ball mesh to follow the physics body
        if (this.ballMesh && this.ballBody) {
            this.ballMesh.position.copy(this.ballBody.position);
            this.ballMesh.quaternion.copy(this.ballBody.quaternion);
        }

        if (this.camera.position.z < 5)
        this.camera.position.z = 5;

        this.players.forEach(player => {
            player.update();
        });

        console.log(score);
        if (this.ballBody.position.y < -40) {
            score.team1 =+ 1;
            this.resetScene();
        }
        if (this.ballBody.position.y > 40) {
            score.team2 =+ 1;
            this.resetScene();
        }
        this.updateScore();
        this.handleKeyStates();
        this.debugRenderer.update();
        this.renderer.render(this.scene, this.camera);
    }

    resetScene(){
        this.ballBody.position.set(0, 0, 5);
        this.resetMomentum(this.ballBody);
        this.players.forEach(player => {
            this.resetMomentum(player.truckMesh);

        });
        this.updateScore();
    }

    animate() {
        // requestAnimationFrame(this.animate.bind(this));
        requestAnimationFrame(this.animate);
        this.world.step(1 / 60);
        this.update();
    }

    initEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Space'].includes(e.code)) {
                this.keyState[e.code] = true;
                e.preventDefault();
            }
            if ([ 'KeyR' ].includes(e.code)) {
                this.keyState[e.code] = true;
            } 
        }, true);
        document.addEventListener('keyup', (e) => {
            if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Space'].includes(e.code)) {
                this.keyState[e.code] = false;
                e.preventDefault();
            }
            if (e.code === 'KeyR') {
                this.resetPerformed = false; 
            }
        }, true);
    }
    
    // handleKeyStates() {
    //     const maxSteerVal = Math.PI / 4; // Increase this value to allow sharper turns
    //     const maxForce = 2500; // Adjust this value to control the engine power
    //     const steeringLerpFactor = 0.1; // Adjust this value to control the smoothness of the steering

    //     if (this.players[0]){
    //             if (this.keyState['ArrowUp']) {
    //                 console.log("Up");
    //                 this.players[0].vehicle.applyEngineForce(-maxForce, 0);
    //                 this.players[0].vehicle.applyEngineForce(-maxForce, 1);
    //             } else if (this.keyState['ArrowDown']) {
    //                 console.log("Down");
    //                 this.players[0].vehicle.applyEngineForce(maxForce/2, 0);
    //                 this.players[0].vehicle.applyEngineForce(maxForce/2, 1);
    //             } else {
    //                 this.players[0].vehicle.applyEngineForce(0, 0);
    //                 this.players[0].vehicle.applyEngineForce(0, 1);
    //             }
            
    //             let targetSteeringValue = 0;
    //             if (this.keyState['ArrowLeft']) {
    //                 console.log("Left");
    //                 targetSteeringValue = maxSteerVal;
    //             } else if (this.keyState['ArrowRight']) {
    //                 console.log("Right");
    //                 targetSteeringValue = -maxSteerVal;
    //             }
            
    //             [0, 1].forEach(index => {
    //                 const currentSteeringValue = this.players[0].vehicle.wheelInfos[index].steering;
    //                 const newSteeringValue = THREE.MathUtils.lerp(currentSteeringValue, targetSteeringValue, steeringLerpFactor);
    //                 this.players[0].vehicle.setSteeringValue(newSteeringValue, index);
    //             });
            
    //             if (this.keyState['Space']) {
    //                 const chassisBody = this.players[0].chassisBody;
                
    //                 // Calculate the forward direction vector (local y-axis)
    //                 const forwardDirection = new CANNON.Vec3(0, 1, 0);
    //                 chassisBody.quaternion.vmult(forwardDirection, forwardDirection); // Transform to world direction
                
    //                 // Scale the direction vector by the desired force value
    //                 const impulse = forwardDirection.scale(50); // Adjust the force value as needed
                
    //                 // Calculate the point of application at the back of the chassis
    //                 const backOffset = new CANNON.Vec3(0, -2, 0); // Adjust offset to match the back of your chassis
    //                 const pointOfApplication = chassisBody.position.vadd(backOffset);
                
    //                 // Apply the impulse in the forward direction at the back of the chassis
    //                 chassisBody.applyImpulse(impulse, pointOfApplication);
    //             }
            
    //             if (this.keyState['KeyR'] && !this.resetPerformed) {
    //                 const player = this.players[0];

    //                 // Get the current orientation
    //                 const currentQuaternion = player.chassisBody.quaternion;
                
    //                 // Extract the current forward and right vectors
    //                 const forward = new CANNON.Vec3(1, 0, 0);
    //                 currentQuaternion.vmult(forward, forward);
                
    //                 const right = new CANNON.Vec3(0, 1, 0);
    //                 currentQuaternion.vmult(right, right);
                
    //                 // Compute the new up vector
    //                 const up = new CANNON.Vec3(0, 0, 1);
                
    //                 // Create a new quaternion based on the forward and up vectors
    //                 const newQuaternion = new CANNON.Quaternion();
    //                 newQuaternion.setFromVectors(forward, right, up);
                
    //                 // Set the new orientation to the chassis body and truck mesh
    //                 player.chassisBody.quaternion.copy(newQuaternion);
    //                 player.chassisMesh.quaternion.copy(player.chassisBody.quaternion);
    //                 this.resetMomentum(player.chassisBody);

    //                 this.resetPerformed = true;
    //             }}
    // }

// //-----------------------------------------------------------------------

handleKeyStates() {
    const maxSteerVal = Math.PI / 4; // Increase this value to allow sharper turns
    const maxForce = 2500; // Adjust this value to control the engine power
    const steeringLerpFactor = 0.1; // Adjust this value to control the smoothness of the steering
    const rotationSpeed = 0.02;
    if (this.players[0])
    {
            if (this.keyState['ArrowUp'])
            {
                console.log("Up");
                this.players[0].vehicle.applyEngineForce(-maxForce, 0);
                this.players[0].vehicle.applyEngineForce(-maxForce, 1);
            } else if (this.keyState['ArrowDown']) {
                console.log("Down");
                this.players[0].vehicle.applyEngineForce(maxForce/2, 0);
                this.players[0].vehicle.applyEngineForce(maxForce/2, 1);
            } else {
                this.players[0].vehicle.applyEngineForce(0, 0);
                this.players[0].vehicle.applyEngineForce(0, 1);
            }
        
            let targetSteeringValue = 0;
            if (this.keyState['ArrowLeft']) {
                console.log("Left");
                targetSteeringValue = maxSteerVal;
            } else if (this.keyState['ArrowRight']) {
                console.log("Right");
                targetSteeringValue = -maxSteerVal;
            }
        
            [0, 1].forEach(index => {
                const currentSteeringValue = this.players[0].vehicle.wheelInfos[index].steering;
                const newSteeringValue = THREE.MathUtils.lerp(currentSteeringValue, targetSteeringValue, steeringLerpFactor);
                this.players[0].vehicle.setSteeringValue(newSteeringValue, index);
            });
        
            if (this.keyState['Space']) {
                const jumpForce = new CANNON.Vec3(0, 0, 500); // Adjust the force value as needed
                this.players[0].chassisBody.applyImpulse(jumpForce, this.players[0].chassisBody.position);
                this.resetMomentum(this.players[0].chassisBody);
            }
        
            if (this.keyState['KeyR'] && !this.resetPerformed) {
                const player = this.players[0];

                // Get the current orientation
                const currentQuaternion = player.chassisBody.quaternion;
            
                // Extract the current forward and right vectors
                const forward = new CANNON.Vec3(1, 0, 0);
                currentQuaternion.vmult(forward, forward);
            
                const right = new CANNON.Vec3(0, 1, 0);
                currentQuaternion.vmult(right, right);
            
                // Compute the new up vector
                const up = new CANNON.Vec3(0, 0, 1);
            
                // Create a new quaternion based on the forward and up vectors
                const newQuaternion = new CANNON.Quaternion();
                newQuaternion.setFromVectors(forward, right, up);
            
                // Set the new orientation to the chassis body and truck mesh
                player.chassisBody.quaternion.copy(newQuaternion);
                player.chassisMesh.quaternion.copy(player.chassisBody.quaternion);
                this.resetMomentum(player.chassisBody);

                this.resetPerformed = true;
            }
            }
}
// //-----------------------------------------------------------------------





    getDirectionVectors(chassisBody) {
        // Forward direction (local z-axis)
        const forward = new CANNON.Vec3(0, 1, 0);
        chassisBody.quaternion.vmult(forward, forward);
    
        // Right direction (local x-axis)
        const right = new CANNON.Vec3(1, 0, 0);
        chassisBody.quaternion.vmult(right, right);
    
        // Up direction (local y-axis)
        const up = new CANNON.Vec3(0, 0, 1);
        chassisBody.quaternion.vmult(up, up);
    
        return { forward, right, up };
    }


}

document.addEventListener('DOMContentLoaded', () => {
    new TruckSimulation();
});

export let players = [];

export class Player {
    constructor(world, scene, x, y, z, material) {
        this.world = world;
        this.scene = scene;
        this.defaultMaterial = this.world.defaultContactMaterial;
        this.highFrictionMaterial = new CANNON.Material('highFrictionMaterial');
        // Create chassis shape and body
        const chassisShape = new CANNON.Box(new CANNON.Vec3(0.85, 2.08, 0.5));
        // const centerOfMassOffset = new CANNON.Vec3(0, 0, -0.5);
        this.chassisBody = new CANNON.Body({ mass: 300, material: material });
        // this.chassisBody.addShape(chassisShape, centerOfMassOffset);
         
        // Adjust the center of mass by positioning the chassis shape lower
        const chassisOffset = new CANNON.Vec3(0, -0.09, 0); // Position relative to chassis
        this.chassisBody.addShape(chassisShape, chassisOffset);
    
        // Create cockpit shape and add to chassis body
        const cockpitShape = new CANNON.Box(new CANNON.Vec3(0.80, 0.8, 0.40)); // Adjust dimensions as needed
        const cockpitOffset = new CANNON.Vec3(0, 0, 0.85); // Position relative to chassis
        this.chassisBody.addShape(cockpitShape, cockpitOffset);
 
        this.chassisBody.position.set(x, y, z);
        this.world.addBody(this.chassisBody);
        this.truckMesh;
        this.loadTruckModel();
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
            indexRightAxis: 0,
            indexUpAxis: 2,
            indexForwardAxis: 1
        });

        // Add wheels and vehicle setup
        const wheelOptions = {
            radius: 0.45,
            directionLocal: new CANNON.Vec3(0, 0, -1),
            suspensionRestLength: 0.2,
            maxSuspensionForce: 2000,
            maxSuspensionTravel: 0.1,
            dampingRelaxation: 3.5,
            dampingCompression: 4.5,
            frictionSlip: 5,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 0),
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true,
            material: this.highFrictionMaterial 
        };

        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
            indexRightAxis: 0,
            indexUpAxis: 2,
            indexForwardAxis: 1
        });

        // Adding wheels
        wheelOptions.chassisConnectionPointLocal.set(0.8, -1.2, -0.40); // Rear right-0.55
        this.vehicle.addWheel(wheelOptions);
        wheelOptions.chassisConnectionPointLocal.set(-0.8, -1.2 , -0.40); // Rear left
        this.vehicle.addWheel(wheelOptions);
        wheelOptions.chassisConnectionPointLocal.set(0.8, 1.1, -0.40); // Front right
        this.vehicle.addWheel(wheelOptions);
        wheelOptions.chassisConnectionPointLocal.set(-0.8, 1.1 ,-0.40); // Front left
        this.vehicle.addWheel(wheelOptions);
        this.vehicle.addToWorld(this.world);

        const wheelGroundContactMaterial = new CANNON.ContactMaterial(
            this.highFrictionMaterial,
            this.defaultMaterial,
            {
                friction: 1.0, // Increase friction
                restitution: 0.0
            }
        );
        this.world.addContactMaterial(wheelGroundContactMaterial);

        this.wheelMeshes = [];
        this.vehicle.wheelInfos.forEach((wheel) => {
            const wheelGeometry = new THREE.CylinderGeometry(wheel.radius, wheel.radius, 0.25, 20);
            const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
            this.scene.add(wheelMesh);
            this.wheelMeshes.push(wheelMesh);
        });
    }
    applyDrag() {
        const dragFactor = 0.99; // Adjust this factor to control the deceleration rate
        this.chassisBody.velocity.scale(dragFactor, this.chassisBody.velocity);
        this.chassisBody.angularVelocity.scale(dragFactor, this.chassisBody.angularVelocity);
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
                // this.truckMesh.rotation.x = -Math.PI;
                // const rotationEuler = new THREE.Euler().setFromQuaternion(this.truckMesh.quaternion);
                // rotationEuler.y += Math.PI / 2; // Adjust this value as needed
                // this.truckMesh.quaternion.setFromEuler(rotationEuler);
                this.scene.add(this.truckMesh);
            });
        });
    }

    update() {
        if (this.truckMesh) {
            this.truckMesh.position.set(this.chassisBody.position.x, this.chassisBody.position.y, this.chassisBody.position.z);
            this.truckMesh.quaternion.set(this.chassisBody.quaternion.x, this.chassisBody.quaternion.y, this.chassisBody.quaternion.z, this.chassisBody.quaternion.w);
                    // Apply offset correctly
            const offset = new THREE.Vector3(0, -0.82, -0.2); // Adjust Y value as needed
            offset.applyQuaternion(this.truckMesh.quaternion);
            this.truckMesh.position.add(offset);
        }
        

        this.vehicle.wheelInfos.forEach((wheel, index) => {
            this.vehicle.updateWheelTransform(index);
            const t = wheel.worldTransform;
            this.wheelMeshes[index].position.copy(t.position);
            this.wheelMeshes[index].quaternion.copy(t.quaternion);
            // Adjust the rotation to add to the existing Z rotation
            const rotationEuler = new THREE.Euler().setFromQuaternion(this.wheelMeshes[index].quaternion);
            rotationEuler.z += Math.PI / 2; // Adjust this value as needed
            this.wheelMeshes[index].quaternion.setFromEuler(rotationEuler);
        });
        this.applyDrag();
    }
}


// //XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX

// Resize game window on window resize
// window.addEventListener('resize', onWindowResize, false);

// function onWindowResize() {
//     camera.aspect = width / height;
//     camera.updateProjectionMatrix();
//     renderer.setSize(width, height);
// }
// // 
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

// // export function updatePlayerVisualization() {
// //     // if (players.length > 0) {
// //     //         players.forEach(player => {
// //     //                 scene.add(player.mesh);
// //     //         });
// //     // }
// // }
// 
// // export var delta;
// 
// 
// 
// // export function movePlayer(delta) {
// //     const speed = 10; // Adjust speed as necessary
// //     const deceleration = 0.92; // Deceleration factor
// //     let x = 0;
// //     let z = 0;
// 
// //     if (keyState['ArrowLeft']) {
// 
// //     }
// //     if (keyState['ArrowRight']) {
// 
// //     }
// //     if (keyState['ArrowUp']) {
//         
// //     } if (keyState['ArrowDown']) {
// 
// //     }
// //     // Emit movement data to the server
// //         // Apply deceleration if no key is pressed
// //     // if (!(keyState['ArrowLeft'] || keyState['ArrowRight'])) {
// //     //     x = players[0].velocity.x * deceleration;
// //     // }
// //     // if (!(keyState['ArrowUp'] || keyState['ArrowDown'])) {
// //     //     z = players[0].velocity.z * deceleration;
// //     // // }
// //     // players[0].velocity.x = x;
// //     // players[0].velocity.z = z;
// 
// 
// //     // //Send new position to server players[]
// //     // if (x !== 0 || z !== 0 ) //if both 0 = false
// //     // {   
// //     //     if (socket && socket.readyState)
// //     //     {
// //     //         let cmd = "move";
// //     //         const movementData = { x, z };
// //     //         socket.send(JSON.stringify({ cmd , movementData })); //Sending to gameserv/consumers.py 
// //     //     }
// //     //     players[0].mesh.position.x += x;
// //     //     players[0].mesh.position.z += z;
// //     // }
// //     updatePlayerVisualization();
// // }

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
