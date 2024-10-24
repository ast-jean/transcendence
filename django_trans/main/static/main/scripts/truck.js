import * as THREE from 'three';
import { socket, room_id } from './socket_truck.js'

import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as CANNON from 'cannon';
import CannonDebugRenderer from './CannonDebugRenderer.js';

let score = { team1: 0, team2: 0 }
let team1 = [];
let team2 = [];
let gameStarted = false; //toggle to cam to spectate

export let players = [];
const team1ColorPicker = document.getElementById('team1');
const team2ColorPicker = document.getElementById('team2');


let lastCallTime = null;
function calculatePing() {
	let currentTime = Date.now();
    if (currentTime % 10 === 0)
	{
		if (lastCallTime !== null) {
			let timeDifference = currentTime - lastCallTime;
			// console.log(`Time since last call: ${timeDifference} ms`);
			document.getElementById('ping').textContent = "ping: " + timeDifference + 'ms'
		}
		lastCallTime = currentTime;
	}
}
document.getElementById("truckTeam1Score").style.backgroundColor = team1ColorPicker.value;
document.getElementById("truckTeam2Score").style.backgroundColor = team2ColorPicker.value;

function showLoader() {
	console.log("Start Loading");
	document.querySelector('.loader').style.display = 'block';
}

function hideLoader() {
	console.log("Stop Loading");
	document.querySelector('.loader').style.display = 'none';
}

let debug = false;
export let playerNumber = 0;

export function setPlayerNumber(value) {
	playerNumber = value;
}

class TruckSimulation {
	constructor() {
		showLoader();
		this.keyState = {};
		this.toggleCam = false;
		this.jumpStartTime = null; // Variable to track jump start time
		this.jumpDuration = 0.5; // Duration of the jump in seconds
		this.jumpStartVelocity = new CANNON.Vec3(); // Store initial velocity
		this.team1Color = team1ColorPicker.value;
		this.team2Color = team2ColorPicker.value;
		this.handleKeyStates();
		this.manager = new THREE.LoadingManager();
		this.initloadingManager();
		
		this.scene = new THREE.Scene();  
		this.initThree(); 
		this.initCannon();
		this.walls = [];
		this.addWalls();
		this.addStaticPlane();
		this.addStadium();
		this.addRoof();
		this.addBall();
		team1.push(this.addPlayer(2, 3, 5, "team1"));
		team2.push(this.addPlayer(2, 3, -5, "team2"));
		this.updateColor = this.updateColor.bind(this);
		this.initEventListeners();

		this.animate = this.animate.bind(this);
		this.relativeCameraOffset = new THREE.Vector3(0, 10, 5);
		this.boostActive = false;
		this.resetPerformed = false;
		if (debug === true)
			this.debugRenderer = new CannonDebugRenderer(this.scene, this.world);

	}

	animate() {
		requestAnimationFrame(this.animate);
		this.world.step(1 / 60);
		this.update();
	}

	initloadingManager(){
		this.manager.onLoad = () => {
			hideLoader(); // Hide loader only when all assets are loaded
			this.animate(); // Start animation after everything is loaded
		};
		this.textureLoader = new THREE.TextureLoader(this.manager);  
	}

	initThree() {      
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
		this.scene.add(ambientLight);
		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(10, 10, 10);
		this.scene.add(directionalLight);

		const container = document.getElementById('truckGameCont');
		const width = container.clientWidth;
		const height = container.clientHeight;
		
		this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);


		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(width, height);
        this.renderer.id = "gameCanvas";
		// this.renderer.setSize(500, 400); //temp
		container.appendChild(this.renderer.domElement);
		// document.querySelector('body').appendChild(this.renderer.domElement);
		this.camera.position.set(5, -5, 3);
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
	}

	addStaticPlane() {
		// Create the plane body
		const planeShape = new CANNON.Plane();
		const planeBody = new CANNON.Body({ mass: 0, material: this.planeMaterial });
		planeBody.addShape(planeShape);
		planeBody.position.set(0, 0, 0);
		planeBody.quaternion.setFromEuler(0, 0, -Math.PI / 2);
		this.world.addBody(planeBody);
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
		body.velocity.set(0, 0, 0);
		body.angularVelocity.set(0, 0, 0);
	}
	

	addStadium() {
		const mtlLoader = new MTLLoader(this.manager);
		mtlLoader.load('/static/main/obj/stadium.mtl', (materials) => {
			materials.preload();
	
			// Load the OBJ file and set its materials
			const objLoader = new OBJLoader(this.manager);
			objLoader.setMaterials(materials);
			objLoader.load('/static/main/obj/stadium.obj', (object) => {
				// Adjust the scale and position of the loaded object
				object.scale.set(0.55, 0.55, 0.55);
				object.position.set(0, 0, 0);
				// Add the object to the scene
				this.scene.add(object);
			});
	});
	}

	addWalls() {
		const wallShape1Left = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
		const wallBody1Left = new CANNON.Body({ mass: 0 });
		wallBody1Left.addShape(wallShape1Left);
		wallBody1Left.position.set(-17, -36.2, 0);
		this.world.addBody(wallBody1Left);

		const wallShape1Right = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
		const wallBody1Right = new CANNON.Body({ mass: 0 });
		wallBody1Right.addShape(wallShape1Right);
		wallBody1Right.position.set(17, -36.2, 0);
		this.world.addBody(wallBody1Right);

		const wallShapeBack = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
		const wallBodyBack = new CANNON.Body({ mass: 0 });
		wallBodyBack.addShape(wallShapeBack);
		wallBodyBack.position.set(0, -42, 0);
		this.world.addBody(wallBodyBack);
		
		const wallShape1Top = new CANNON.Box(new CANNON.Vec3(10, 1, 1));
		const wallBody1Top = new CANNON.Body({ mass: 0 });
		wallBody1Top.addShape(wallShape1Top);
		wallBody1Top.position.set(0, -36.2, 9);
		this.world.addBody(wallBody1Top);
		
		const wallShape2Left = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
		const wallBody2Left = new CANNON.Body({ mass: 0 });
		wallBody2Left.addShape(wallShape2Left);
		wallBody2Left.position.set(-17, 36.2, 0);
		this.world.addBody(wallBody2Left);
	
		const wallShape2Right = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
		const wallBody2Right = new CANNON.Body({ mass: 0 });
		wallBody2Right.addShape(wallShape2Right);
		wallBody2Right.position.set(17, 36.2, 0);
		this.world.addBody(wallBody2Right);
		
		const wallShapeBack2 = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
		const wallBodyBack2 = new CANNON.Body({ mass: 0 });
		wallBodyBack2.addShape(wallShapeBack2);
		wallBodyBack2.position.set(0, 42, 0);
		this.world.addBody(wallBodyBack2);
	
		const wallShape2Top = new CANNON.Box(new CANNON.Vec3(10, 1, 1));
		const wallBody2Top = new CANNON.Body({ mass: 0 });
		wallBody2Top.addShape(wallShape2Top);
		wallBody2Top.position.set(0, 36.2, 9);
		this.world.addBody(wallBody2Top);

		const wallShape3 = new CANNON.Box(new CANNON.Vec3(1, 50, 10));
		const wallBody3 = new CANNON.Body({ mass: 0 });
		wallBody3.addShape(wallShape3);
		wallBody3.position.set(-25, 0, 0);
		this.world.addBody(wallBody3);
	
		const wallShape4 = new CANNON.Box(new CANNON.Vec3(1, 50, 10));
		const wallBody4 = new CANNON.Body({ mass: 0 });
		wallBody4.addShape(wallShape4);
		wallBody4.position.set(25, 0, 0);
		this.world.addBody(wallBody4);
			
		const cornerWallShape = new CANNON.Box(new CANNON.Vec3(1, 10, 10));
	
		const cornerWallBody1 = new CANNON.Body({ mass: 0 });
		cornerWallBody1.addShape(cornerWallShape);
		cornerWallBody1.position.set(-25, -30, 0);
		cornerWallBody1.quaternion.setFromEuler(0, 0, Math.PI / 4); // 45 degrees
		this.world.addBody(cornerWallBody1);
	
		const cornerWallBody2 = new CANNON.Body({ mass: 0 });
		cornerWallBody2.addShape(cornerWallShape);
		cornerWallBody2.position.set(25, -30, 0);
		cornerWallBody2.quaternion.setFromEuler(0, 0, -Math.PI / 4); // -45 degrees
		this.world.addBody(cornerWallBody2);    
	
		const cornerWallBody3 = new CANNON.Body({ mass: 0 });
		cornerWallBody3.addShape(cornerWallShape);
		cornerWallBody3.position.set(-25, 30, 0);
		cornerWallBody3.quaternion.setFromEuler(0, 0, -Math.PI / 4); // -45 degrees
		this.world.addBody(cornerWallBody3);
		
		const cornerWallBody4 = new CANNON.Body({ mass: 0 });
		cornerWallBody4.addShape(cornerWallShape);
		cornerWallBody4.position.set(25, 30, 0);
		cornerWallBody4.quaternion.setFromEuler(0, 0, Math.PI / 4); // -45 degrees
		this.world.addBody(cornerWallBody4);
		
		// Create Three.js materials for visualization
		const wallMaterial1 = new THREE.MeshToonMaterial({ color: 0x4B3239 });
		const wallMaterial2 = new THREE.MeshToonMaterial({ color: this.team2Color });
		const wallMaterial3 = new THREE.MeshToonMaterial({ color: this.team1Color });

		// Create corresponding Three.js meshes for visualization
		const wallGeometry1 = new THREE.BoxGeometry(20, 2, 20);
		const wallGeometryTop = new THREE.BoxGeometry(20, 2, 2);

		const wallMesh1Left = new THREE.Mesh(wallGeometry1, wallMaterial3);
		wallMesh1Left.position.copy(wallBody1Left.position);
		this.walls.push({ body: wallBody1Left, mesh: wallMesh1Left });
		this.scene.add(this.walls[this.walls.length - 1].mesh);
		// this.scene.add(wallMesh1Left);

		const wallMesh1Right = new THREE.Mesh(wallGeometry1, wallMaterial3);
		wallMesh1Right.position.copy(wallBody1Right.position);
		this.walls.push({ body: wallBody1Right, mesh: wallMesh1Right });
		this.scene.add(this.walls[this.walls.length - 1].mesh);
		// this.scene.add(wallMesh1Right);
	
		const wallMesh1Top = new THREE.Mesh(wallGeometryTop, wallMaterial3);
		wallMesh1Top.position.copy(wallBody1Top.position);
		this.walls.push({ body: wallBody1Top, mesh: wallMesh1Top });
		this.scene.add(this.walls[this.walls.length - 1].mesh);
		// this.scene.add(wallMesh1Top);

		const wallMesh2Left = new THREE.Mesh(wallGeometry1, wallMaterial2);
		let euler = new THREE.Euler(0, 0, Math.PI / 2, 'XYZ');
		wallMesh2Left.quaternion.setFromEuler(euler);
		wallMesh2Left.position.copy(wallBody2Left.position);
		this.walls.push({ body: wallBody2Left, mesh: wallMesh2Left });
		this.scene.add(this.walls[this.walls.length - 1].mesh);
		// this.scene.add(wallMesh2Left);
	
		const wallMesh2Right = new THREE.Mesh(wallGeometry1, wallMaterial2);
		wallMesh2Right.quaternion.setFromEuler(euler);
		wallMesh2Right.position.copy(wallBody2Right.position);
		this.walls.push({ body: wallBody2Right, mesh: wallMesh2Right });
		this.scene.add(this.walls[this.walls.length - 1].mesh);
		// this.scene.add(wallMesh2Right);
	
		const wallMesh2Top = new THREE.Mesh(wallGeometryTop, wallMaterial2);
		wallMesh2Top.quaternion.setFromEuler(euler);
		wallMesh2Top.position.copy(wallBody2Top.position);
		this.walls.push({ body: wallBody2Top, mesh: wallMesh2Top });
		this.scene.add(this.walls[this.walls.length - 1].mesh);
		// this.scene.add(wallMesh2Top);

		const wallGeometry3 = new THREE.BoxGeometry(2, 100, 20);
		const wallMesh3 = new THREE.Mesh(wallGeometry3, wallMaterial1);
		wallMesh3.position.copy(wallBody3.position);
		this.walls.push({ body: wallBody3, mesh: wallMesh3 });
		this.scene.add(this.walls[this.walls.length - 1].mesh);
		// this.scene.add(wallMesh3);
	
		const wallMesh4 = new THREE.Mesh(wallGeometry3, wallMaterial1);
		wallMesh4.position.copy(wallBody4.position);
		this.walls.push({ body: wallBody4, mesh: wallMesh4 });
		this.scene.add(this.walls[this.walls.length - 1].mesh);
		// this.scene.add(wallMesh4);

		// Create corner wall meshes
		const cornerWallGeometry = new THREE.BoxGeometry(2, 20, 20);
		const cornerWallMesh1 = new THREE.Mesh(cornerWallGeometry, wallMaterial1);
		cornerWallMesh1.position.copy(cornerWallBody1.position);
		cornerWallMesh1.quaternion.copy(cornerWallBody1.quaternion);
		this.walls.push({ body: cornerWallBody1, mesh: cornerWallMesh1 });
		this.scene.add(this.walls[this.walls.length - 1].mesh);
		// this.scene.add(cornerWallMesh1);
	
		const cornerWallMesh2 = new THREE.Mesh(cornerWallGeometry, wallMaterial1);
		cornerWallMesh2.position.copy(cornerWallBody2.position);
		cornerWallMesh2.quaternion.copy(cornerWallBody2.quaternion);
		this.walls.push({ body: cornerWallBody2, mesh: cornerWallMesh2 });
		// this.scene.add(cornerWallMesh2);
		this.scene.add(this.walls[this.walls.length - 1].mesh);
	
		const cornerWallMesh3 = new THREE.Mesh(cornerWallGeometry, wallMaterial1);
		cornerWallMesh3.position.copy(cornerWallBody3.position);
		cornerWallMesh3.quaternion.copy(cornerWallBody3.quaternion);
		this.walls.push({ body: cornerWallBody3, mesh: cornerWallMesh3 });
		// this.scene.add(cornerWallMesh3);
		this.scene.add(this.walls[this.walls.length - 1].mesh);
	
		const cornerWallMesh4 = new THREE.Mesh(cornerWallGeometry, wallMaterial1);
		cornerWallMesh4.position.copy(cornerWallBody4.position);
		cornerWallMesh4.quaternion.copy(cornerWallBody4.quaternion);
		this.walls.push({ body: cornerWallBody4, mesh: cornerWallMesh4 });
		this.scene.add(this.walls[this.walls.length - 1].mesh);
		// this.scene.add(cornerWallMesh4);
	}

	addRoof() {
		const roofMaterial = new CANNON.Material('roofMaterial');
		const roofShape = new CANNON.Box(new CANNON.Vec3(50, 50, 1)); // Dimensions of the roof
		const roofBody = new CANNON.Body({ mass: 0, material: roofMaterial });
		roofBody.addShape(roofShape);
		roofBody.position.set(0, 0, 11); // Position the roof above the scene
		this.world.addBody(roofBody);
	}

	addBall() {
		const ballRadius = 1; // Adjust the radius as needed
		const ballShape = new CANNON.Sphere(ballRadius);
		const ballMaterial = new CANNON.Material();
		const ballBody = new CANNON.Body({
			mass: 2, // Adjust mass as needed
			shape: ballShape,
			material: ballMaterial
		});
	
		ballBody.position.set(-1, 0, 3); // Position the ball above the ground
		this.world.addBody(ballBody);
		const mtlLoader = new MTLLoader(this.manager);
		mtlLoader.load('/static/main/obj/ball.mtl', (materials) => {
			materials.preload();
			const objLoader = new OBJLoader(this.manager);
			objLoader.setMaterials(materials);
			objLoader.load('/static/main/obj/ball.obj', (object) => {
				object.scale.set(ballRadius, ballRadius, ballRadius);
				object.position.set(0, 0, 3);
				this.scene.add(object);
				this.ballMesh = object;
			});
		});
		this.ballBody = ballBody;
	}

	addPlayer(x, y, z, team) {
		let player;
		//position according to player index
		if (team === "team1") {
			player = new Player(this.world, this.scene, x, y, z, this.team1Color);
		} else if (team === "team2") {
			player = new Player(this.world, this.scene, x, y, z, this.team2Color);
		}
		players.push(player);
		return player;
	}

	movePlayer(index, force, steering) {
		const player = players[index];
		player.setEngineForce(force);
		player.setSteeringValue(steering);
	}

	updateCameraPosition() {
		const player = players[playerNumber];
		if (!player) {
			console.warn('No player available');
			return;
		}
	
		const playerPosition = new THREE.Vector3(player.chassisBody.position.x, player.chassisBody.position.y, player.chassisBody.position.z);
		const playerQuaternion = new THREE.Quaternion(player.chassisBody.quaternion.x, player.chassisBody.quaternion.y, player.chassisBody.quaternion.z, player.chassisBody.quaternion.w);
	
		const desiredCameraPosition = this.relativeCameraOffset.clone().applyQuaternion(playerQuaternion).add(playerPosition);
		const direction = desiredCameraPosition.clone().sub(playerPosition).normalize();
		const ray = new THREE.Raycaster(playerPosition.clone(), direction, 0, 10);

		// Ensure all wall meshes are defined before passing to the Raycaster
		const wallMeshes = this.walls.map(wall => {
			if (!wall.mesh) {
				console.warn('Undefined mesh detected:', wall);
			}
			return wall.mesh;
		}).filter(mesh => mesh !== undefined);
	
		if (wallMeshes.length === 0) {
			console.warn('No wall meshes available for raycasting');
			return;
		}
	
		const intersects = ray.intersectObjects(wallMeshes, true);
	
		if (intersects.length > 0) {
			const distance = intersects[0].distance;
			const newCameraPosition = playerPosition.clone().add(direction.multiplyScalar(distance - 0.5));
			this.camera.position.copy(newCameraPosition);
		} else {
			this.camera.position.lerp(desiredCameraPosition, 0.1);
		}

		if (this.toggleCam === false) {
			this.camera.lookAt(playerPosition);
		} else {
			this.camera.lookAt(this.ballMesh.position);
		}
	
		if (this.camera.position.z < 2) {
			this.camera.position.z = 2;
		}
	}

    updateColor() {
        this.team1Color = team1ColorPicker.value;
        this.team2Color = team2ColorPicker.value;
		document.getElementById("truckTeam1Score").style.backgroundColor = this.team1Color;
		document.getElementById("truckTeam2Score").style.backgroundColor = this.team2Color;
        if (team1.length !== 0) {
            team1.forEach(player => {
                if (player)
                player.truckMesh.children.forEach((child) => {
                    if (child.name === "chassis") {
                        child.material = new THREE.MeshToonMaterial({
                            color: new THREE.Color(this.team1Color), 
                        });
                    }
                });
            });
        }

		if (this.walls && this.walls.length > 0) {
			this.walls.slice(0, 3).forEach(wall => {
				wall.mesh.material  = new THREE.MeshToonMaterial({
					color: new THREE.Color(this.team1Color),
				});
			});
		   this.walls.slice(3, 6).forEach(wall => {
					wall.mesh.material  = new THREE.MeshToonMaterial({
					color: new THREE.Color(this.team2Color), 
				});
			});
		}
	}

	update() {
		// Loop through each wall entry and update the mesh to match the body's position and quaternion
		this.walls.forEach(wall => {
			wall.mesh.position.copy(wall.body.position);
			wall.mesh.quaternion.copy(wall.body.quaternion);
			wall.mesh.scale.set(1, 1, 1);
		});
		
		if (gameStarted === true)
		{
			if (players[playerNumber]) {
				const player = players[playerNumber];
				const chassisBody = player.chassisBody;
				const cameraOffset = this.relativeCameraOffset.clone().applyQuaternion(new THREE.Quaternion(
					chassisBody.quaternion.x, chassisBody.quaternion.y, chassisBody.quaternion.z, chassisBody.quaternion.w
					)).add(new THREE.Vector3(chassisBody.position.x, chassisBody.position.y, chassisBody.position.z));    
					this.camera.position.lerp(cameraOffset, 0.1);
					player.chassisBody.position.copy(chassisBody.position);
					player.chassisBody.quaternion.copy(chassisBody.quaternion);
				}
				this.updateCameraPosition();
			}
			
			if (this.ballMesh && this.ballBody) {
				this.ballMesh.position.copy(this.ballBody.position);
				this.ballMesh.quaternion.copy(this.ballBody.quaternion);
			}

			players.forEach(player => {
				if (player){
					player.update();
				}
			});
			
			if (this.jumpStartTime) {
				const elapsed = (performance.now() - this.jumpStartTime) / 1000;
				if (elapsed < this.jumpDuration) {
					const t = elapsed / this.jumpDuration;
					const newPos = new CANNON.Vec3();
					newPos.x = this.jumpStartPos.x + (this.jumpTargetPos.x - this.jumpStartPos.x) * t;
					newPos.y = this.jumpStartPos.y + (this.jumpTargetPos.y - this.jumpStartPos.y) * t;
					newPos.z = this.jumpStartPos.z + (this.jumpTargetPos.z - this.jumpStartPos.z) * t;
					players[playerNumber].chassisBody.position.copy(newPos);
				} else {
					const velocityChange = new CANNON.Vec3(
						this.jumpTargetPos.x - this.jumpStartPos.x,
						this.jumpTargetPos.y - this.jumpStartPos.y,
						this.jumpTargetPos.z - this.jumpStartPos.z
						).scale(1 / this.jumpDuration);
						const newVelocity = this.jumpStartVelocity.clone().vadd(velocityChange);
						players[playerNumber].chassisBody.position.copy(this.jumpTargetPos);
						players[playerNumber].chassisBody.velocity.copy(newVelocity); // Apply the new momentum
						this.jumpStartTime = null; // Reset jump
					}
					
				}
				
				
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
				if (debug === true)
					this.debugRenderer.update();
			this.renderer.render(this.scene, this.camera);
			if (socket.readyState === WebSocket.OPEN || room_id) {
					calculatePing();
					let currentTime = Date.now();
				if (players[playerNumber] && currentTime % 5 === 0) {
					players[playerNumber].sendSync(room_id);
				}
				// else {
				// 	if (playerNumber % 2 === 0) {
				// 		team2.push(this.addPlayer(2, 2, -5, "team2"));
				// 	} else {
				// 		team1.push(this.addPlayer(2, 2, 5, "team1"));
				// 	}
				// }

			}
		}
		
		resetScene(){
			this.ballBody.position.set(0, 0, 5);
			this.resetMomentum(this.ballBody);
			players.forEach(player => {
				this.resetMomentum(player.truckMesh);
				
			});
			this.updateScore();
		}
		
		initEventListeners() {            
			document.getElementById('team1').addEventListener('change', this.updateColor);
			document.getElementById('team2').addEventListener('change', this.updateColor);
			document.addEventListener('keydown', (e) => {
				if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Space', 'ShiftLeft'].includes(e.code)) {
					this.keyState[e.code] = true;
					// e.preventDefault();
			}
			if ([ 'KeyR' ].includes(e.code)) {
				this.keyState[e.code] = true;
			}
			if ([ 'KeyR' ].includes(e.code)) {
				this.keyState[e.code] = true;
			} 
			}, true);
			document.addEventListener('keyup', (e) => {
				if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Space', 'ShiftLeft'].includes(e.code)) {
					this.keyState[e.code] = false;
					e.preventDefault();
				}
				if (e.code === 'KeyR') {
					this.resetPerformed = false; 
				}
				if (e.code === 'KeyX') {
					// this.toggleCam = !this.toggleCam;
					console.log(players[playerNumber])
					// playerNumber = playerNumber === 0 ? 1 : 0;
				}
			}, true);
		}


// //-----------------------------------------------------------------------

handleKeyStates() {
	const maxSteerVal = Math.PI / 4; // Increase this value to allow sharper turns
	const maxForce = 2500; // Adjust this value to control the engine power
	const steeringLerpFactor = 0.1; // Adjust this value to control the smoothness of the steering
	const rotationSpeed = 0.02;
	if (players[playerNumber])
	{
		const player = players[playerNumber];
			if (this.keyState['ArrowUp'])
			{
				player.vehicle.applyEngineForce(-maxForce, 0);
				player.vehicle.applyEngineForce(-maxForce, 1);

			} else if (this.keyState['ArrowDown']) {
				player.vehicle.applyEngineForce(maxForce/2, 0);
				player.vehicle.applyEngineForce(maxForce/2, 1);
			} else {
				player.vehicle.applyEngineForce(0, 0);
				player.vehicle.applyEngineForce(0, 1);
			}
		
			let targetSteeringValue = 0;
			if (this.keyState['ArrowLeft']) {
				targetSteeringValue = maxSteerVal;
			} else if (this.keyState['ArrowRight']) {
				targetSteeringValue = -maxSteerVal;
			}
		
			[0, 1].forEach(index => {
				const currentSteeringValue = player.vehicle.wheelInfos[index].steering;
				const newSteeringValue = THREE.MathUtils.lerp(currentSteeringValue, targetSteeringValue, steeringLerpFactor);
				player.vehicle.setSteeringValue(newSteeringValue, index);
			});
			// if (!player.isGrounded) {
			//            if (this.keyState['ArrowUp']) {
			//             const rotationQuaternion = new CANNON.Quaternion();
			//             rotationQuaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -this.rotationSpeed);
			//             player.chassisBody.quaternion = player.chassisBody.quaternion.mult(rotationQuaternion);
			//         }
			//         if (this.keyState['ArrowDown']) {
			//             const rotationQuaternion = new CANNON.Quaternion();
			//             rotationQuaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), this.rotationSpeed);
			//             player.chassisBody.quaternion = player.chassisBody.quaternion.mult(rotationQuaternion);
			//         }
			//         if (this.keyState['ArrowLeft']) {
			//             const rotationQuaternion = new CANNON.Quaternion();
			//             rotationQuaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), this.rotationSpeed);
			//             player.chassisBody.quaternion = player.chassisBody.quaternion.mult(rotationQuaternion);
			//         }
			//         if (this.keyState['ArrowRight']) {
			//             const rotationQuaternion = new CANNON.Quaternion();
			//             rotationQuaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -this.rotationSpeed);
			//             player.chassisBody.quaternion = player.chassisBody.quaternion.mult(rotationQuaternion);
			//         }
			// }
			if (this.keyState['Space'] && players.length > 0) {
				if (player.isGrounded && !this.jumpStartTime) {
					this.jumpStartTime = performance.now();
					this.jumpStartPos = player.chassisBody.position.clone();
					this.jumpStartVelocity.copy(player.chassisBody.velocity);
					this.jumpTargetPos = this.jumpStartPos.clone();
					this.jumpTargetPos.z += 2;
				}
			}
			if (this.keyState['KeyR'] && !this.resetPerformed) {
				if (players.length > 0) {
					if (player && player.chassisBody) {
						const forward = new CANNON.Vec3(0, -1, 0);
						player.chassisBody.quaternion.vmult(forward, forward);
						const yaw = Math.atan2(forward.y, forward.x);
						const uprightQuaternion = new CANNON.Quaternion();
						uprightQuaternion.setFromEuler(0, 0, yaw, "YZX");
						player.chassisBody.quaternion.copy(uprightQuaternion);
						if (player.chassisMesh) {
							player.chassisMesh.quaternion.copy(player.chassisBody.quaternion);
						}
						this.resetMomentum(player.chassisBody);
						this.resetPerformed = true;
					}
				}
			}
			if (this.keyState['ShiftLeft']) {
				player.applyBoost();
				this.relativeCameraOffset = new THREE.Vector3(0, 12, 5);
			} else {
				player.isBoosting = false;
				this.relativeCameraOffset = new THREE.Vector3(0, 10, 5);
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

export class Player {
	constructor(world, scene, x, y, z, teamColor) {
		this.world = world;
		this.scene = scene;
		this.teamColor = teamColor;
		this.index;

		this.defaultMaterial = this.world.defaultContactMaterial;
		this.highFrictionMaterial = new CANNON.Material('highFrictionMaterial');
		this.isGrounded = false;

		const chassisShape = new CANNON.Box(new CANNON.Vec3(0.85, 2.08, 0.5));
		this.chassisBody = new CANNON.Body({ mass: 300 });
		const chassisOffset = new CANNON.Vec3(0, -0.09, -0.1); // Position relative to chassis
		this.chassisBody.addShape(chassisShape, chassisOffset);
	
		const cockpitShape = new CANNON.Box(new CANNON.Vec3(0.80, 0.8, 0.40)); // Adjust dimensions as needed
		const cockpitOffset = new CANNON.Vec3(0, 0, 0.65); // Position relative to chassis
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
				friction: 5.0,
				restitution: 0.0
			}
		);
		this.world.addContactMaterial(wheelGroundContactMaterial);

		this.wheelMeshes = [];
		this.vehicle.wheelInfos.forEach((wheel) => {
			const wheelGeometry = new THREE.CylinderGeometry(wheel.radius, wheel.radius, 0.25, 20);
			const wheelMaterial = new THREE.MeshToonMaterial({ color: 0x888888 });
			const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
			this.scene.add(wheelMesh);
			this.wheelMeshes.push(wheelMesh);
		});
	}

	applyBoost() {
		const boostForceMagnitude = 100; // Adjust the boost force value as needed
		const localForward = new CANNON.Vec3(0, -1, 0); // Assuming forward direction is along the Y-axis
		const worldForward = this.chassisBody.quaternion.vmult(localForward);
		const boostImpulse = worldForward.scale(boostForceMagnitude);
		this.vehicle.chassisBody.applyImpulse(boostImpulse, worldForward);
	}

	applyDrag() {
		const dragFactor = 0.995; // Adjust this factor to control the deceleration rate
		this.chassisBody.velocity.scale(dragFactor, this.chassisBody.velocity);
		this.chassisBody.angularVelocity.scale(dragFactor, this.chassisBody.angularVelocity);
	}

	checkGroundContact() {
		this.isGrounded = false; // Reset grounded state
		// Iterate through each wheel
		for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
			const wheel = this.vehicle.wheelInfos[i];
			if (wheel.suspensionLength < wheel.suspensionRestLength) {
				this.isGrounded = true;
				break;
			}
		}
	}

	sendSync(roomId) {
		if (roomId) {
			let cmd = "sync";
			let index = playerNumber;
			let position 		= this.chassisBody.position;
			let quaternion 		= this.chassisBody.quaternion;
			let velocity 		= this.chassisBody.velocity;
			let angularVelocity = this.chassisBody.angularVelocity;
			const movementData 	= {
				position,
				quaternion,
				velocity,
				angularVelocity
			};
			socket.send(JSON.stringify({ cmd , index, roomId, movementData }));
		}
	}
	
	updateState (movementData) {
		if (this.chassisBody) {
			let vector = new CANNON.Vec3(movementData.position);

			this.chassisBody.position.lerp(this.chassisBody.position, 0.1,vector);
			
			this.chassisBody.quaternion.copy(movementData.quaternion);
			this.chassisBody.velocity.copy(movementData.velocity);
			this.chassisBody.angularVelocity.copy(movementData.angularVelocity);
		}
	}

	loadTruckModel() {
		const loader = new GLTFLoader(this.manager);
		loader.load('/static/main/obj/truck.glb', (gltf) => {
			gltf.scene.traverse((child) => {
				if (child.isMesh && child.name === "chassis") {
					child.material = new THREE.MeshToonMaterial({
						color: new THREE.Color(this.teamColor),
						wireframe: false
					});
				}
			});
			this.truckMesh = gltf.scene;
			this.truckMesh.scale.set(0.5, 0.5, 0.5);
			this.scene.add(this.truckMesh);
		}, undefined, (error) => {
			console.error('An error happened while loading the model:', error);
		});
	}

	updateBoost() {
		if (this.isBoosting && this.boostLevel > 0) {
			this.boostLevel -= this.boostUsageRate;
			if (this.boostLevel < 0) {
				this.boostLevel = 0;
			}
		} else if (this.boostLevel < this.maxBoostLevel) {
			this.boostLevel += this.boostRechargeRate;
			if (this.boostLevel > this.maxBoostLevel) {
				this.boostLevel = this.maxBoostLevel;
			}
		}
		const boostBar = document.getElementById('boost-bar');
		if (boostBar) {
			boostBar.style.width = `${this.boostLevel}%`;
		}
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
		// Update vehicle state to ensure wheel contact info is current
		this.applyDrag();
		this.checkGroundContact();
		this.updateBoost();
	}
}

// //XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX
// Resize game window on window resize
window.addEventListener('resize', onWindowResize, false);

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
}

// export function receiveSync(id, movementData) {
// 	const player = players.find(p => p.id === id);
// 	if (player) {
// 		if (movementData) {
// 			if (movementData.x)
// 				player.mesh.position.x += movementData.x;
// 			if (movementData.z) 
// 				player.mesh.position.z += movementData.z;
// 		}
// 	} else {
// 		console.log("Player doesnt exist, creating one");
// 		if (!movementData.x)
// 			movementData.x = 0;
// 		players.push(new Player(id, movementData.x, movementData.z));
// 		if (!movementData.z)
// 			movementData.z = 0;
// 	}
// }



export let TruckSim;
document.addEventListener('DOMContentLoaded', () => {
	TruckSim = new TruckSimulation();
});
