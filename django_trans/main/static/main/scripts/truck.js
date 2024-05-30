import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { socket } from './socket_truck.js'

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as CANNON from 'cannon';
import CannonDebugRenderer from './CannonDebugRenderer.js';


class TruckSimulation {
    constructor() {
        this.keyState = {};
        this.players = []; 
        this.initThree();
        this.initCannon();
        this.addStaticPlane();
        this.addWalls();
        this.addBall();
        this.initThree(); 
        this.resetPerformed = false; 
        this.addStaticPlane();
        this.initCannon();
        this.debugRenderer = new CannonDebugRenderer(this.scene, this.world);
        this.initEventListeners();
        this.animate = this.animate.bind(this);
        this.animate();
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
                friction: 0.3,
                restitution: 0.9,
            }
        );
        this.world.addContactMaterial(this.world.defaultContactMaterial);
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

    addWalls() {
        // Define wall material
        const wallMaterial = new CANNON.Material('wallMaterial');

        // Wall 1 - Left Part and Right Part
        const wallShape1Left = new CANNON.Box(new CANNON.Vec3(10, 1, 1));
        const wallBody1Left = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody1Left.addShape(wallShape1Left);
        wallBody1Left.position.set(-20, -37.5, 0);
        this.world.addBody(wallBody1Left);

        const wallShape1Right = new CANNON.Box(new CANNON.Vec3(10, 1, 1));
        const wallBody1Right = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody1Right.addShape(wallShape1Right);
        wallBody1Right.position.set(20, -37.5, 0);
        this.world.addBody(wallBody1Right);

        // Wall 2
        const wallShape2 = new CANNON.Box(new CANNON.Vec3(25, 1, 1));
        const wallBody2 = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody2.addShape(wallShape2);
        wallBody2.position.set(0, 37.5, 0);
        this.world.addBody(wallBody2);

        // Wall 3
        const wallShape3 = new CANNON.Box(new CANNON.Vec3(1, 75, 1));
        const wallBody3 = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody3.addShape(wallShape3);
        wallBody3.position.set(-25, 0, 0);
        this.world.addBody(wallBody3);

        // Wall 4
        const wallShape4 = new CANNON.Box(new CANNON.Vec3(1, 75, 1));
        const wallBody4 = new CANNON.Body({ mass: 0, material: wallMaterial });
        wallBody4.addShape(wallShape4);
        wallBody4.position.set(25, 0, 0);
        this.world.addBody(wallBody4);
    }

    addBall() {
        // Create a bouncy ball
        const ballRadius = 1; // Adjust the radius as needed
        const ballShape = new CANNON.Sphere(ballRadius);
        const ballMaterial = new CANNON.Material();
        const ballBody = new CANNON.Body({
            mass: 5, // Adjust mass as needed
            shape: ballShape,
            material: ballMaterial
        });

        ballBody.position.set(0, 5, 5); // Position the ball above the ground

        this.world.addBody(ballBody);
        // Add the ball mesh for visualization
        const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
        const ballMaterialVisual = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const ballMesh = new THREE.Mesh(ballGeometry, ballMaterialVisual);
        this.scene.add(ballMesh);
        
        this.ballMesh = ballMesh;
        this.ballBody = ballBody;
    }

    addPlayer(x, y, z) {
        const player = new Player(this.world, this.scene, x, y, z, this.carMaterial);
        this.players.push(player);
    }

    movePlayer(index, force, steering) {
        const player = this.players[index];
        player.setEngineForce(force);
        player.setSteeringValue(steering);
    }

    update() {
        this.world.step(1 / 60);

        this.players.forEach(player => {
            player.update();
        });
        this.debugRenderer.update();

        if (this.ballBody.position.y > -40)
            this.ballBody.position.set(0, 0, 5);
    
        this.renderer.render(this.scene, this.camera);
    }

    animate() {
        // requestAnimationFrame(this.animate.bind(this));
        requestAnimationFrame(this.animate);
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
    
    handleKeyStates() {
        const maxSteerVal = Math.PI / 4; // Increase this value to allow sharper turns
        const maxForce = 1500; // Adjust this value to control the engine power
        const steeringLerpFactor = 0.1; // Adjust this value to control the smoothness of the steering
    
        if (this.keyState['ArrowUp']) {
            this.vehicle.applyEngineForce(-maxForce, 2);
            this.vehicle.applyEngineForce(-maxForce, 3);
        } else if (this.keyState['ArrowDown']) {
            this.vehicle.applyEngineForce(maxForce, 2);
            this.vehicle.applyEngineForce(maxForce, 3);
        } else {
            this.vehicle.applyEngineForce(0, 2);
            this.vehicle.applyEngineForce(0, 3);
        }
    
        let targetSteeringValue = 0;
        if (this.keyState['ArrowLeft']) {
            targetSteeringValue = maxSteerVal;
        } else if (this.keyState['ArrowRight']) {
            targetSteeringValue = -maxSteerVal;
        }
    
        [0, 1].forEach(index => {
            const currentSteeringValue = this.vehicle.wheelInfos[index].steering;
            const newSteeringValue = THREE.MathUtils.lerp(currentSteeringValue, targetSteeringValue, steeringLerpFactor);
            this.vehicle.setSteeringValue(newSteeringValue, index);
        });
    
    
        if (this.keyState['Space']) {
            const jumpForce = new CANNON.Vec3(0, 500, 0); // Adjust the force value as needed
            this.chassisBody.applyImpulse(jumpForce, this.chassisBody.position);
        }
    
        if (this.keyState['KeyR'] && !this.resetPerformed) {
            this.chassisBody.quaternion.set(0, 0, 0, 1);
            this.truckMesh.quaternion.set(0, 0, 0, 1);
            this.chassisBody.position.y += 1; // Offset up to prevent glitching
            this.resetPerformed = true;
        }
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
        // Create chassis shape and body
        const chassisShape = new CANNON.Box(new CANNON.Vec3(0.85, 2.08, 0.5));
        const centerOfMassOffset = new CANNON.Vec3(0, 0, -0.5);
        this.chassisBody = new CANNON.Body({ mass: 150, material: material });
        this.chassisBody.addShape(chassisShape, centerOfMassOffset);
        this.chassisBody.position.set(x, y, z);
        this.world.addBody(this.chassisBody);
        this.loadTruckModel();
        
        // Create chassis mesh
        const chassisGeometry = new THREE.BoxGeometry(1.7, 4.16, 1);
        const chassisMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
        this.scene.add(this.chassisMesh);

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
            rollInfluence: 0.05,
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 0),
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        };

        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
            indexRightAxis: 0,
            indexUpAxis: 2,
            indexForwardAxis: 1
        });

        // Adding wheels
        wheelOptions.chassisConnectionPointLocal.set(0.8, -1.2, -0.30); // Rear right-0.55
        this.vehicle.addWheel(wheelOptions);
        wheelOptions.chassisConnectionPointLocal.set(-0.8, -1.2 , -0.30); // Rear left
        this.vehicle.addWheel(wheelOptions);
        wheelOptions.chassisConnectionPointLocal.set(0.8, 1.1, -0.30); // Front right
        this.vehicle.addWheel(wheelOptions);
        wheelOptions.chassisConnectionPointLocal.set(-0.8, 1.1 ,-0.30); // Front left
        this.vehicle.addWheel(wheelOptions);
        this.vehicle.addToWorld(this.world);

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

    update() {
        if (this.truckMesh) {
            this.truckMesh.position.set(this.chassisBody.position.x, this.chassisBody.position.y, this.chassisBody.position.z);
            this.truckMesh.quaternion.set(this.chassisBody.quaternion.x, this.chassisBody.quaternion.y, this.chassisBody.quaternion.z, this.chassisBody.quaternion.w);
                    // Apply offset correctly
            const offset = new THREE.Vector3(0, -0.82, -0.2); // Adjust Y value as needed
            offset.applyQuaternion(this.truckMesh.quaternion);
            this.truckMesh.position.add(offset);

            const relativeCameraOffset = new THREE.Vector3(0, 10, 5);
            const cameraOffset = relativeCameraOffset.applyMatrix4(this.truckMesh.matrixWorld);
            this.camera.position.lerp(cameraOffset, 0.1);
            if ( this.camera.position.z < 5 )
            this.camera.position.z = 5;
            this.camera.lookAt(this.truckMesh.position);
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
        this.handleKeyStates();
        this.debugRenderer.update(); // Update the debug renderer
        this.renderer.render(this.scene, this.camera);
    }
}

// class TruckSimulation {
//     constructor() {
//         this.keyState = {};
//         this.initThree(); 
//         this.resetPerformed = false; 
//         this.addStaticPlane();
//         this.initCannon();
//         this.loadTruckModel();
//         this.debugRenderer = new CannonDebugRenderer(this.scene, this.world);
//         this.initEventListeners();
//         this.animate = this.animate.bind(this);
//         this.animate();
//     }

// //     initThree() {
// //         this.scene = new THREE.Scene();
// //
// //         const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
// //         this.scene.add(ambientLight);
// //
// //         const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
// //         directionalLight.position.set(10, 10, 10);
// //         this.scene.add(directionalLight);
// //
// //         this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// //         this.renderer = new THREE.WebGLRenderer();
// //         this.renderer.setSize(window.innerWidth, window.innerHeight);
// //         document.getElementById('gameCont').appendChild(this.renderer.domElement);
// //
// //         this.camera.position.set(0, 0, -0);
// //         this.camera.lookAt(0, 0, 0);
// //         this.camera.up.set(0, 0, 1); 
// //
//  // const controls = new OrbitControls(this.camera, this.renderer.domElement);
// //     }

// //     initCannon() {
// //         this.world = new CANNON.World();
// //         this.world.gravity.set(0, 0, -9.82); // Correct gravity vector
// //         // Create default contact material for the world
// //         const defaultMaterial = new CANNON.Material('defaultMaterial');
// //         this.world.defaultContactMaterial = new CANNON.ContactMaterial(
// //             defaultMaterial,
// //             defaultMaterial,
// //             {
// //                 friction: 0.4,
// //                 restitution: 0.9,
// //             }
// //         );
// //         this.world.addContactMaterial(this.world.defaultContactMaterial);

    //    // Create Cannon.js material
//    //     this.planeMaterial = new CANNON.Material('planeMaterial');
        
//         // Create the plane body
//         const planeShape = new CANNON.Plane();
//         const planeBody = new CANNON.Body({ mass: 0, material: this.planeMaterial });
//         planeBody.addShape(planeShape);
//         planeBody.position.set(0, 0, 0);
//         planeBody.quaternion.setFromEuler(0, 0, -Math.PI / 2);
//         this.world.addBody(planeBody);

//         // Store the plane body for external access
//         this.planeBody = planeBody;

//         // Create the Three.js plane mesh for visualization
//         const planeGeometry = new THREE.PlaneGeometry(50, 75);
//         const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x888888, side: THREE.DoubleSide });
//         const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
//         this.scene.add(planeMesh);

//         // Store the plane mesh for external access
//         this.planeMesh = planeMesh;







//      // Create chassis shape and body
//      const chassisShape = new CANNON.Box(new CANNON.Vec3(0.85, 2.08, 0.5));
//      this.chassisBody = new CANNON.Body({ mass: 300 });
 
//      // Adjust the center of mass by positioning the chassis shape lower
//      const chassisOffset = new CANNON.Vec3(0, -0.09, 0); // Position relative to chassis
//      this.chassisBody.addShape(chassisShape, chassisOffset);
 
//      // Create cockpit shape and add to chassis body
//      const cockpitShape = new CANNON.Box(new CANNON.Vec3(0.80, 0.8, 0.40)); // Adjust dimensions as needed
//      const cockpitOffset = new CANNON.Vec3(0, 0, 0.80); // Position relative to chassis
//      this.chassisBody.addShape(cockpitShape, cockpitOffset);
 
//      this.chassisBody.position.set(0, 0, 0);
//      this.world.addBody(this.chassisBody);

//         const wheelOptions = {
//             radius: 0.45,
//             directionLocal: new CANNON.Vec3(0, 0, -1),
//             suspensionRestLength: 0.2,
//             maxSuspensionForce: 2000,
//             maxSuspensionTravel: 0.1,
//             dampingRelaxation: 3.5,
//             dampingCompression: 4.5,
//             frictionSlip: 5,
//             rollInfluence: 0.05,
//             axleLocal: new CANNON.Vec3(1, 0, 0),
//             chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 0),
//             customSlidingRotationalSpeed: -30,
//             useCustomSlidingRotationalSpeed: true
//         };

//         this.vehicle = new CANNON.RaycastVehicle({
//             chassisBody: this.chassisBody,
//             indexRightAxis: 0,
//             indexUpAxis: 2,
//             indexForwardAxis: 1
//         });

//  // // Adding wheels
//  // wheelOptions.chassisConnectionPointLocal.set(0.8, -1.2, -0.30); // Rear right-0.55
//  // this.vehicle.addWheel(wheelOptions);
//  // wheelOptions.chassisConnectionPointLocal.set(-0.8, -1.2 , -0.30); // Rear left
//  // this.vehicle.addWheel(wheelOptions);
//  // wheelOptions.chassisConnectionPointLocal.set(0.8, 1.1, -0.30); // Front right
//  // this.vehicle.addWheel(wheelOptions);
//  // wheelOptions.chassisConnectionPointLocal.set(-0.8, 1.1 ,-0.30); // Front left
//  // this.vehicle.addWheel(wheelOptions);
//  // this.vehicle.addToWorld(this.world);

// //        this.wheelMeshes = [];
// //      this.vehicle.wheelInfos.forEach((wheel, index) => {
// //          const wheelGeometry = new THREE.CylinderGeometry(wheel.radius, wheel.radius, 0.25, 20);
// //          const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
// //          const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
// //          this.scene.add(wheelMesh);
// //          this.wheelMeshes.push(wheelMesh);
// //  });


// // Create walls
// //const wallMaterial = new CANNON.Material();




// // Wall 1 - Left Part
// const wallShape1Left = new CANNON.Box(new CANNON.Vec3(10, 1, 5));
// const wallBody1Left = new CANNON.Body({ mass: 0, material: wallMaterial });
// wallBody1Left.addShape(wallShape1Left);
// wallBody1Left.position.set(-20, -37.5, 0);
// this.world.addBody(wallBody1Left);

// // Wall 1 - Right Part
// const wallShape1Right = new CANNON.Box(new CANNON.Vec3(10, 1, 5));
// const wallBody1Right = new CANNON.Body({ mass: 0, material: wallMaterial });
// wallBody1Right.addShape(wallShape1Right);
// wallBody1Right.position.set(20, -37.5, 0);
// this.world.addBody(wallBody1Right);

// // Wall 1
// const wallShape1 = new CANNON.Box(new CANNON.Vec3(25, 1, 5));
// const wallBody1 = new CANNON.Body({ mass: 0, material: wallMaterial });
// wallBody1.addShape(wallShape1);
// wallBody1.position.set(0, -37.5, 5);
// this.world.addBody(wallBody1);

// // Wall 2
// const wallShape2 = new CANNON.Box(new CANNON.Vec3(25, 1, 20));
// const wallBody2 = new CANNON.Body({ mass: 0, material: wallMaterial });
// wallBody2.addShape(wallShape2);
// wallBody2.position.set(0, 37.5, 0);
// this.world.addBody(wallBody2);

// // Wall 3
// const wallShape3 = new CANNON.Box(new CANNON.Vec3(1, 75, 20));
// const wallBody3 = new CANNON.Body({ mass: 0, material: wallMaterial });
// wallBody3.addShape(wallShape3);
// wallBody3.position.set(-25, 0, 0);
// this.world.addBody(wallBody3);

// // Wall 4
// const wallShape4 = new CANNON.Box(new CANNON.Vec3(1, 75, 20));
// const wallBody4 = new CANNON.Body({ mass: 0, material: wallMaterial });
// wallBody4.addShape(wallShape4);
// wallBody4.position.set(25, 0, 0);
// this.world.addBody(wallBody4);


//    // Create a bouncy ball
//    const ballRadius = 1; // Adjust the radius as needed
//    const ballShape = new CANNON.Sphere(ballRadius);
//    const ballMaterial = new CANNON.Material();
//    const ballBody = new CANNON.Body({
//        mass: 5, // Adjust mass as needed
//        shape: ballShape,
//        material: ballMaterial
//    });

//    ballBody.position.set(0, 5, 5); // Position the ball above the ground

//    this.world.addBody(ballBody);
//     // Add the ball mesh for visualization
//     const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
//     const ballMaterialVisual = new THREE.MeshStandardMaterial({ color: 0xff0000 });
//     const ballMesh = new THREE.Mesh(ballGeometry, ballMaterialVisual);
//     this.scene.add(ballMesh);
//     }

// loadTruckModel() {
//     const mtlLoader = new MTLLoader();
//     mtlLoader.load('/static/main/obj/truck.mtl', (materials) => {
//         materials.preload();
//         const objLoader = new OBJLoader();
//         objLoader.setMaterials(materials);
//         objLoader.load('/static/main/obj/truck.obj', (mesh) => {
//             this.truckMesh = mesh;
//             this.truckMesh.scale.set(0.5, 0.5, 0.5);
//             // this.truckMesh.rotation.x = -Math.PI;
//             // const rotationEuler = new THREE.Euler().setFromQuaternion(this.truckMesh.quaternion);
//             // rotationEuler.y += Math.PI / 2; // Adjust this value as needed
//             // this.truckMesh.quaternion.setFromEuler(rotationEuler);
//             this.scene.add(this.truckMesh);
//         });
//     });
// }

//     addStaticPlane() {
//         // // Create Cannon.js material
//         // this.planeMaterial = new CANNON.Material('planeMaterial');
        
//         // // Create the plane body
//         // const planeShape = new CANNON.Plane();
//         // const planeBody = new CANNON.Body({ mass: 0, material: this.planeMaterial });
//         // planeBody.addShape(planeShape);
//         // planeBody.position.set(0, 0, 0);
//         // planeBody.quaternion.setFromEuler(0, 0, -Math.PI / 2);
//         // this.world.addBody(planeBody);

//         // // Store the plane body for external access
//         // this.planeBody = planeBody;

//         // // Create the Three.js plane mesh for visualization
//         // const planeGeometry = new THREE.PlaneGeometry(200, 200);
//         // const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x888888, side: THREE.DoubleSide });
//         // const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
//         // this.scene.add(planeMesh);

//         // // Store the plane mesh for external access
//         // this.planeMesh = planeMesh;
//     }

//     createBouncyBall() {
//         // Create a bouncy ball
//         const ballRadius = 1; // Adjust the radius as needed
//         const ballShape = new CANNON.Sphere(ballRadius);
//         const ballMaterial = new CANNON.Material('ballMaterial');
//         const ballBody = new CANNON.Body({
//             mass: 5, // Adjust mass as needed
//             shape: ballShape,
//             material: ballMaterial
//         });

//         ballBody.position.set(0, 5, 5); // Position the ball above the ground

//         // Set the bounciness using planeMaterial
//         const ballContactMaterial = new CANNON.ContactMaterial(
//             this.planeMaterial,
//             ballMaterial,
//             { friction: 0.0, restitution: 0.7 } // High restitution for bounciness
//         );
//         this.world.addContactMaterial(ballContactMaterial);
//         this.world.addBody(ballBody);

//         // Add the ball mesh for visualization
//         const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
//         const ballMaterialVisual = new THREE.MeshStandardMaterial({ color: 0xff0000 });
//         const ballMesh = new THREE.Mesh(ballGeometry, ballMaterialVisual);
//         this.scene.add(ballMesh);

//         this.ballMesh = ballMesh;
//         this.ballBody = ballBody;
//     }
    // animate() 
    // {
    //     requestAnimationFrame(this.animate);

    //     this.world.step(1 / 60);

    //     if (this.truckMesh) {
    //         this.truckMesh.position.set(this.chassisBody.position.x, this.chassisBody.position.y, this.chassisBody.position.z);
    //         this.truckMesh.quaternion.set(this.chassisBody.quaternion.x, this.chassisBody.quaternion.y, this.chassisBody.quaternion.z, this.chassisBody.quaternion.w);
    
    //         // Apply offset correctly
    //         const offset = new THREE.Vector3(0, -0.82, -0.2); // Adjust Y value as needed
    //         offset.applyQuaternion(this.truckMesh.quaternion);
    //         this.truckMesh.position.add(offset);

    //         const relativeCameraOffset = new THREE.Vector3(0, 10, 5);
    //         const cameraOffset = relativeCameraOffset.applyMatrix4(this.truckMesh.matrixWorld);
    //         this.camera.position.lerp(cameraOffset, 0.1);
    //         if ( this.camera.position.z < 5 )
    //             this.camera.position.z = 5;
    //         this.camera.lookAt(this.truckMesh.position);
    //     }
    //     this.vehicle.wheelInfos.forEach((wheel, index) => {
    //         this.vehicle.updateWheelTransform(index);
    //         const t = wheel.worldTransform;
    //         this.wheelMeshes[index].position.copy(t.position);
    //         this.wheelMeshes[index].quaternion.copy(t.quaternion);
    //         // Adjust the rotation to add to the existing Z rotation
    //         const rotationEuler = new THREE.Euler().setFromQuaternion(this.wheelMeshes[index].quaternion);
    //         rotationEuler.z += Math.PI / 2; // Adjust this value as needed
    //         this.wheelMeshes[index].quaternion.setFromEuler(rotationEuler);
    //     });
    //     this.applyDrag();
    //     this.handleKeyStates();
    //     this.debugRenderer.update(); // Update the debug renderer
    //     this.renderer.render(this.scene, this.camera);

    //     if (ballBody.position.y > -40)
    //         ballBody.position.set(0, 0, 5);


    // }
//     applyDrag() {
//         const dragFactor = 0.99; // Adjust this factor to control the deceleration rate
//         this.chassisBody.velocity.scale(dragFactor, this.chassisBody.velocity);
//         this.chassisBody.angularVelocity.scale(dragFactor, this.chassisBody.angularVelocity);
//     }
//     initEventListeners() {
//         document.addEventListener('keydown', (e) => {
//             if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Space'].includes(e.code)) {
//                 this.keyState[e.code] = true;
//                 e.preventDefault();
//             }
//            if ([ 'KeyR' ].includes(e.code)) {
//                 this.keyState[e.code] = true;
//            } 
//         }, true);
//         document.addEventListener('keyup', (e) => {
//             if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Space'].includes(e.code)) {
//                 this.keyState[e.code] = false;
//                 e.preventDefault();
//             }
//             if (e.code === 'KeyR') {
//                 this.resetPerformed = false; 
//            }
//         }, true);
//     }

//     handleKeyStates() {
        
//         const maxSteerVal = Math.PI / 4; // Increase this value to allow sharper turns
//         const maxForce = 1500; // Adjust this value to control the engine power
//         const steeringLerpFactor = 0.1; // Adjust this value to control the smoothness of the steering
    
//         if (this.keyState['ArrowUp']) {
//             this.vehicle.applyEngineForce(-maxForce, 2);
//             this.vehicle.applyEngineForce(-maxForce, 3);
//         } else if (this.keyState['ArrowDown']) {
//             this.vehicle.applyEngineForce(maxForce, 2);
//             this.vehicle.applyEngineForce(maxForce, 3);
//         } else {
//             this.vehicle.applyEngineForce(0, 2);
//             this.vehicle.applyEngineForce(0, 3);
//         }
    
//         let targetSteeringValue = 0;
//         if (this.keyState['ArrowLeft']) {
//             targetSteeringValue = maxSteerVal;
//         } else if (this.keyState['ArrowRight']) {
//             targetSteeringValue = -maxSteerVal;
//         }
    
//         [0, 1].forEach(index => {
//             const currentSteeringValue = this.vehicle.wheelInfos[index].steering;
//             const newSteeringValue = THREE.MathUtils.lerp(currentSteeringValue, targetSteeringValue, steeringLerpFactor);
//             this.vehicle.setSteeringValue(newSteeringValue, index);
//         });
    
    
//         if (this.keyState['Space']) {
//             const jumpForce = new CANNON.Vec3(0, 500, 0); // Adjust the force value as needed
//             this.chassisBody.applyImpulse(jumpForce, this.chassisBody.position);
//         }
    
//         if (this.keyState['KeyR'] && !this.resetPerformed) {
//             this.chassisBody.quaternion.set(0, 0, 0, 1);
//             this.truckMesh.quaternion.set(0, 0, 0, 1);
//             this.chassisBody.position.y += 1; // Offset up to prevent glitching
//             this.resetPerformed = true;
//         }
//     }
// }

// document.addEventListener('DOMContentLoaded', () => {
//     new TruckSimulation();
// });




// // // //XXXXX_X_X_X_X_X_XX_X_X_X_X_X_X_X_X_X_X_X_X_X_XX_X_X_X_X_X_X_X_X_X_X
// // // var clock = new THREE.Clock();
// // // let colors = [
// // //     0x00ff00, // Green
// // //     0xff0000, // Red
// // //     0x0000ff, // Blue
// // //     0xffff00, // Yellow
// // //     0x00ffff, // Cyan
// // //     0xff00ff, // Magenta
// // //     0xffa500, // Orange
// // //     0x800080, // Purple
// // //     0x008080, // Teal
// // //     0x808000  // Olive
// // // ];
// // //  let i = 0;
// // export let players = [];
// // export class Player {
// //     constructor(id, x, z) {
// //         this.id = id;
// //         this.velocity = { x: 0, z: 0 };
// 
// //         // Assuming colors and i are defined somewhere in your code that makes them accessible here.
// //         // let material = new THREE.MeshBasicMaterial({ color: colors[i++] });
// //         // material.opacity = 0.5;
// //         // material.transparent = true;
// //         // material.needsUpdate = true;
// //         const mtlLoader = new MTLLoader();
// //         mtlLoader.load(
// //             '/static/main/obj/truck.mtl', // Path to your MTL file
// //             (materials) => {
//                 
// //                 materials.preload();
// 
// //                 const objLoader = new OBJLoader();
// //                 objLoader.setMaterials(materials); // Apply the materials to the OBJ loader
// //                 objLoader.load(
// //                     '/static/main/obj/truck.obj', // Path to your OBJ file
// //                     (root) => {
// //                         this.mesh = root;
// //                         this.mesh.position.set(0, y, z);
// //                         this.mesh.scale.set(0.5, 0.5, 0.5); // Scale the model
// 
// //                         // Rotate the mesh 180 degrees around the Y-axis
// //                         // this.mesh.rotation.y = Math.PI;
// 
// //                         // Add the loaded mesh to the scene
// //                         scene.add(this.mesh);
// 
// //                         // Log the new player creation after the mesh has been set up
// //                         console.log('New player:', this);
// //                     },
// //                     (xhr) => {
// //                         console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
// //                     },
// //                     (error) => {
// //                         console.log('An error happened during loading:', error);
// //                     }
// //                 );
// //             },
// //             (xhr) => {
// //                 console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
// //             },
// //             (error) => {
// //                 console.log('An error happened during loading MTL:', error);
// //             }
// //         );
// //     }
// // }
// 
// // // const container = document.getElementById('gameCont');
// // // const width = container.clientWidth;
// // // const height = container.clientWidth * 0.666;
// 
// // // const scene = new THREE.Scene();
// // // const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
// // // players.push(new Player(5,0,5));
// // // // camera.lookAt(players[0].mesh.position); 
// // // camera.position.set(0, 5, -5);
// 
// // // const renderer = new THREE.WebGLRenderer();
// // // renderer.setSize(width, height);
// // // renderer.setClearColor(0x000001);
// // // // renderer.domElement.style.aspectRatio = 'auto 1 / 1';
// // // container.appendChild(renderer.domElement);
// 
// 
// 
// // // // Resize game window on window resize
// // // // window.addEventListener('resize', onWindowResize, false);
// 
// // // // function onWindowResize() {
// // // //     camera.aspect = width / height;
// // // //     camera.updateProjectionMatrix();
// // // //     renderer.setSize(width, height);
// // // // }
// 
// // // // function resizeRendererToDisplaySize(renderer) {
// // // //     const canvas = renderer.domElement;
// // // //     const width = canvas.clientWidth;
// // // //     const height = canvas.clientWidth;
// // // //     const needResize = canvas.width !== width || canvas.height !== height;
// // // //     if (needResize) {
// // // //       renderer.setSize(width, height, false);
// // // //     }
// // // //     return needResize;
// // // // } 

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
