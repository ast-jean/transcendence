import * as THREE from 'three';
import { socketState, setupWebSocket, checkAllPlayersConnected, sendCmd, getRoomId } from './socket_pong.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* Btns layer 1     Btns layer 2

    [ ONLINE ]  --->   [ New 1v1 ]
    [  LOCAL ]         [ New 2v2 ]
    [   AI   ]         [ Search  ]

*/

var clock = new THREE.Clock();
let ballSpeedX = 0;
let ballSpeedY = 0;
let local_game = true;
let useAIForPlayer2 = false;
let isGameOver = true;

console.log("loading pong.js file.");

const container = document.getElementById('gameCont');
const width = container.clientWidth;
const height = container.clientWidth * 0.666;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
renderer.setClearColor(0x000001);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

export let players = [];

function hideChat(boolean) {
    const chat = document.getElementById('chat-container');
    if (chat && boolean === true) {
        chat.style.display = 'none';
    }
    if (chat && boolean === false) {
        chat.style.display = 'block';
    }
}

const localPlayButton = document.getElementById('localplay_btn');
const versusAIButton = document.getElementById('versusai_btn');
const playOnlineButton = document.getElementById('onlineplay_btn');


export function showLayer2Btns() {
    var layer2Btns = document.getElementById('layer2Btns');
    layer2Btns.classList.add('active');
    layer2Btns.classList.remove('hidden');
}

export function hideLayer2Btns() {
    var layer2Btns = document.getElementById('layer2Btns');
    layer2Btns.classList.remove('active');
    layer2Btns.classList.add('hidden');
}

if (localPlayButton) {
    localPlayButton.addEventListener('click', () => {
        hideChat(true);
        hideAllButtons();
        localPlay();
    });
}

if (versusAIButton) {
    versusAIButton.addEventListener('click', () => {
        hideChat(true);
        hideAllButtons();
        local_game = false;
        playAI();
    });
}

if (playOnlineButton) {
    playOnlineButton.addEventListener('click', async () => {
        local_game = false;
        showLayer2Btns();
        setupWebSocket().then(() => {
            document.getElementById("OneVsOne").addEventListener('click', () => playOnline(2));
            document.getElementById("TwoVsTwo").addEventListener('click', () => playOnline(4));
        }) .catch(err => {
            console.error("Failed to establish WebSocket connection:", err);
        })
    });
}


function hideAllButtons() {
    let play_btns = document.getElementById('play_btns');
    if (play_btns) {
        play_btns.style.display = "none";
    }
}

document.getElementById('randomize-colors-btn').addEventListener('click', randomizeColors);
document.querySelectorAll('.game-button').forEach(button => {
    if (!button.classList.contains('randomize-colors-btn')) {
        button.addEventListener('click', hideAllButtons);
    }
});

export function startCountdown() {
    const countdownContainer = document.createElement('div');
    countdownContainer.id = 'countdown';
    countdownContainer.style.position = 'absolute';
    countdownContainer.style.top = '50%';
    countdownContainer.style.left = '50%';
    countdownContainer.style.transform = 'translate(-50%, -50%)';
    countdownContainer.style.fontSize = '3em';
    countdownContainer.style.color = '#fff';
    document.body.appendChild(countdownContainer);

    let countdown = 3;
    countdownContainer.textContent = countdown;

    const interval = setInterval(() => {
        countdown--;
        if (countdown === 0) {
            clearInterval(interval);
            document.body.removeChild(countdownContainer);
            // console.log("ball start");
            isGameOver = false;
            ballSpeedX = 10;
            ballSpeedY = 10;
        } else {
            countdownContainer.textContent = countdown;
        }
    }, 1000);
}

const wallThickness = 0.5;
export const wallLength = 20;
const walls = [];
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

const topWall = new THREE.Mesh(new THREE.BoxGeometry(wallLength, wallThickness, 1), wallMaterial);
topWall.position.set(0, wallLength / 2, 0);
scene.add(topWall);
walls.push(topWall);

const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(wallLength, wallThickness, 1), wallMaterial);
bottomWall.position.set(0, -wallLength / 2, 0);
scene.add(bottomWall);
walls.push(bottomWall);

const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallLength, 1), wallMaterial);
leftWall.position.set(-wallLength / 2, 0, 0);
scene.add(leftWall);
walls.push(leftWall);

const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallLength, 1), wallMaterial);
rightWall.position.set(wallLength / 2, 0, 0);
scene.add(rightWall);
walls.push(rightWall);

var index = 0;
let aiPlayer = null;



function localPlay() {
    console.log("Starting local play");

    players.forEach(player => scene.remove(player.mesh));
    players = [];
    if (aiPlayer) {
        scene.remove(aiPlayer.mesh);
    }

    initializePlayers();

    updatePlayerVisualization();
    startCountdown();
}

function playAI() {
    console.log("Starting play with AI");

    players.forEach(player => scene.remove(player.mesh));
    players = [];
    if (aiPlayer) {
        scene.remove(aiPlayer.mesh);
    }

    let player1 = new Player(1, 0, -wallLength / 2 + 0.5, 0);
    players.push(player1);
    scene.add(player1.mesh);

    aiPlayer = new AIPlayer(2, 0, wallLength / 2 - 0.5, 0);
    players.push(aiPlayer);
    scene.add(aiPlayer.mesh);
    useAIForPlayer2 = true;

    updatePlayerVisualization();
    startCountdown();
}

function cleanScene(){
    hideLayer2Btns();
    players.forEach(player => scene.remove(player.mesh));
    players = [];
    resetPlayer();
    if (aiPlayer) {
        scene.remove(aiPlayer.mesh);
    }
}

function resetPlayer() {
    let local_player = new Player(1, 0, -wallLength / 2 + 0.5, 0);
    players.push(local_player);
    scene.add(local_player.mesh);
    
}
function initializePlayers() {
    players.forEach(player => scene.remove(player.mesh));
    players = [];
    let player1 = new Player(1, 0, -wallLength / 2 + 0.5, 0);
    players.push(player1);
    scene.add(player1.mesh);

    let player2 = new Player(2, 0, wallLength / 2 - 0.5, 0);
    players.push(player2);
    scene.add(player2.mesh);
    updatePlayerVisualization();
}



// Function to wait until room_id changes from null
function waitForRoomId() {
    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            if (getRoomId() !== null) {
                clearInterval(checkInterval);
                resolve(getRoomId());
            }
        }, 100); // Check every 100 milliseconds

        // Optional: Set a timeout to reject the promise if it takes too long
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error("Timed out waiting for room_id to change from null"));
        }, 10000); // 10 seconds timeout
    });
}


//click PlayOnline() -> show Layer2Btns -> Click game mode -> HideLayer2 & waitGameFull -> Start Countdown & Start Game
async function playOnline(maxPlayers) {
    console.log("Starting online play");

    if (socketState.isSocketReady) {
        // Send game mode and wait for joinRoom() from server
        console.log("Connected to server socket")
        players.forEach(player => scene.remove(player.mesh));
        players = [];
        var cmd = "roomCreate" + maxPlayers;
        sendCmd(cmd);
        try {
            await waitForRoomId();
            console.log("Connected to room: " + getRoomId());
        } catch {
            location.reload();
        }

        let local_player = new Player(1, 0, -wallLength / 2 + 0.5, 0);
        players.push(local_player);
        scene.add(local_player.mesh);
        hideLayer2Btns();
        cleanScene();
        sendSync();

        try {
            await checkAllPlayersConnected(maxPlayers);
        } catch (error) {
            console.error("Error waiting for players:", error);
            location.reload();
        }
    }

    updatePlayerVisualization();
}


function onWindowResize() {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
let colors = [
    0x00ff00, 0x0000ff, 0xff0000, 0xffff00,
    0x00ffff, 0xff00ff, 0xffa500, 0x800080,
    0x008080, 0x808000
];
let i = 0;

export class Player {
    constructor(id, x, y, z) {
        this.id = id;

        let material = new THREE.MeshBasicMaterial({ color: colors[i++] });
        material.opacity = 1;
        material.transparent = true;
        material.needsUpdate = true;

        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 0.5), material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
        console.log('New player:', this);
    }
}

export function updatePlayerVisualization() {
    // console.log("Updating player visualization");
    players.forEach(player => {
        scene.add(player.mesh);
    });
}

let player1Score = 0;
let player2Score = 0;
const maxScore = 5;

const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');

function updateScore(player) {
    if (player === 1) {
        player1Score++;
    } else if (player === 2) {
        player2Score++;
    }
    updateScoreDisplay();
    checkEndGame();
}

function updateScoreDisplay() {
    player1ScoreElement.innerHTML = getScoreHTML(player1Score, '🟢', maxScore);
    player2ScoreElement.innerHTML = getScoreHTML(player2Score, '🔵', maxScore);
}

function getScoreHTML(score, symbol, maxScore) {
    let scoreHTML = '';
    for (let i = 0; i < score; i++) {
        scoreHTML += symbol;
    }
    for (let i = score; i < maxScore; i++) {
        scoreHTML += '⚪';
    }
    return scoreHTML;
}

function checkEndGame() {
    if (player1Score >= maxScore || player2Score >= maxScore) {
        endGame();
    }
}

function endGame() {
    isGameOver = true;

    const winner = player1Score >= maxScore ? 'Player 1' : 'Player 2';
    const endGameMessage = document.createElement('div');
    // endGameMessage.id = 'end-game-message';
    // endGameMessage.style.position = 'absolute';
    // endGameMessage.style.top = '50%';
    // endGameMessage.style.left = '50%';
		// endGameMessage.style.transform = 'translate(-50%, -50%)';	
    // endGameMessage.style.fontSize = '2em';
    // endGameMessage.style.color = '#fff';
    endGameMessage.innerHTML = `${winner} wins!<br>`;
    document.getElementById('gameCont').appendChild(endGameMessage);

    const endGameButtons = document.getElementById('end-game-buttons');
    endGameButtons.style.display = 'block';

    document.getElementById('replay-btn').addEventListener('click', () => {
        document.body.removeChild(endGameMessage);
        endGameButtons.style.display = 'none';
        resetGame();
        startCountdown();
    });

    document.getElementById('menu-btn').addEventListener('click', () => {
        document.body.removeChild(endGameMessage);
        endGameButtons.style.display = 'none';
        showAllButtons();
        // hideLayer2Btns();
        resetGame();
        controls.enabled = false;
    });
}

function resetGame() {
    player1Score = 0;
    player2Score = 0;
    ballSpeedX = 0;
    ballSpeedY = 0;
    isGameOver = true;
    sphere.position.set(0, 0, 0);
    players.forEach(player => {
        player.mesh.position.set(0, player.id === 1 ? -wallLength / 2 + 1 : wallLength / 2 - 1, 0);
    });
    updateScoreDisplay();
}

function showAllButtons() {
    const buttons = document.querySelectorAll('.game-button');
    buttons.forEach(button => {
        button.classList.remove('hidden');
    });
}

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(0, 20, 10);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1);
fillLight.position.set(-10, 10, 10);
scene.add(fillLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const ballLight = new THREE.PointLight(0xffffff, 1.5, 50);
ballLight.position.set(0, 0, 5);
scene.add(ballLight);

const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
export const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0, 0, 0);
scene.add(sphere);

export var delta;

var keyState = {};

export let shouldPreventDefault = true;

document.addEventListener('keydown', function (e) {
    if (['ArrowLeft', 'ArrowRight'].includes(e.code)) {
        keyState[e.code] = true;
        if (shouldPreventDefault) {
            e.preventDefault();
        }
    }
    if (local_game && ['KeyA', 'KeyD'].includes(e.code)) {
        keyState[e.code] = true;
        e.preventDefault();
    }
}, true);

document.addEventListener('keyup', function (e) {
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
        keyState[e.code] = false;
        if (local_game && ['KeyA', 'KeyD'].includes(e.code)) {
            e.preventDefault();
        }
    }
}, true);


export function movePlayer(delta) {
    const speed = 20;
    let x1 = 0;
    let x2 = 0;

    if (players[0]){        
        if (keyState['ArrowLeft']) x1 -= speed * delta;
        if (keyState['ArrowRight']) x1 += speed * delta;
        
        if (local_game){
            if (keyState['KeyA']) x2 -= speed * delta;
            if (keyState['KeyD']) x2 += speed * delta;
        }
        
        if (x1 !== 0) {
        let newX = players[0].mesh.position.x + x1;
        if (newX - players[0].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
            newX + players[0].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
                players[0].mesh.position.x = newX;
                if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
                    //sendMove
                    let cmd = "move";
                    const movementData = { x: x1, y: 0 };
                    let roomId = getRoomId();
                    // console.log(movementData, roomId);
                    socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
                }
            }
            // if (socketState.socket)
            //     console.log(socketState.socket);
        }
        
        if (x2 !== 0) {
            let newX = players[1].mesh.position.x + x2;
            if (newX - players[1].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
        newX + players[1].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
            players[1].mesh.position.x = newX;
            if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
                let cmd = "move";
                const movementData = { x: x2 * -1, y: 0 };
                let roomId = getRoomId();
                // console.log(movementData, roomId);
                socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
            }
        }
        // console.log("For X2");
        if (socketState.socket) {
            console.log(socketState.socket);
        } else {
            console.error("Socket is undefined in movePlayer (X2)");
        }
    }
    
        updatePlayerVisualization();
    }
}


// Fonction pour envoyer périodiquement l'état de la balle au serveur
function sendBallState() {
    if (socketState.socket && socketState.isSocketReady) {
        let cmd = "ballSync";
        const ballData = {
            x: sphere.position.x,
            y: sphere.position.y,
            vx: ballSpeedX,
            vy: ballSpeedY
        };
        socketState.socket.send(JSON.stringify({ cmd, ballData }));
    }
}

function moveBall(delta) {
    if (isGameOver) return ;

    let ballPosition = new THREE.Vector2(sphere.position.x, sphere.position.y);
    let ballSpeed = new THREE.Vector2(ballSpeedX, ballSpeedY);
    let newPosition = ballPosition.clone().add(ballSpeed.clone().multiplyScalar(delta));

    function handleCollision(axis, wallBox) {
        ballSpeed[axis] *= -1;
        if (axis === 'x') {
            if (ballSpeed.x > 0) {
                newPosition.x = wallBox.max.x + sphere.geometry.parameters.radius + 0.01;
            } else {
                newPosition.x = wallBox.min.x - sphere.geometry.parameters.radius - 0.01;
            }
        } else if (axis === 'y') {
            if (ballSpeed.y > 0) {
                newPosition.y = wallBox.max.y + sphere.geometry.parameters.radius + 0.01;
            } else {
                newPosition.y = wallBox.min.y - sphere.geometry.parameters.radius + 0.01;
            }
        }
    }

    let scored = false;
    walls.forEach(wall => {
        const wallBox = new THREE.Box3().setFromObject(wall);
        const sphereBox = new THREE.Box3().setFromObject(sphere);

        if (wallBox.intersectsBox(sphereBox)) {
            if (wall === topWall) {
                updateScore(1);
                scored = true;
            } else if (wall === bottomWall) {
                updateScore(2);
                scored = true;
            } else if (wall === leftWall || wall === rightWall) {
                handleCollision('x', wallBox);
            }
        }
    });

    if (!scored) {
        sphere.position.set(newPosition.x, newPosition.y);
    } else {
        sphere.position.set(0, 0, 0);
        ballSpeed.set(5 * (Math.random() > 0.5 ? 1 : -1), 5 * (Math.random() > 0.5 ? 1 : -1));
        ballSpeedX = ballSpeed.x;
        ballSpeedY = ballSpeed.y;
    }

    const speedIncreaseFactor = 1.1;
    players.forEach(player => {
        const playerBox = new THREE.Box3().setFromObject(player.mesh);
        const sphereBox = new THREE.Box3().setFromObject(sphere);

        if (playerBox.intersectsBox(sphereBox)) {
            let relativeIntersectY = (newPosition.y - player.mesh.position.y) / (player.mesh.geometry.parameters.height / 2);
            let bounceAngle = relativeIntersectY * (Math.PI / 8);
            let speed = ballSpeed.length();
            if (newPosition.x > player.mesh.position.x) {
                ballSpeed.set(Math.abs(speed * Math.cos(bounceAngle)), speed * Math.sin(bounceAngle));
            } else {
                ballSpeed.set(-Math.abs(speed * Math.cos(bounceAngle)), speed * Math.sin(bounceAngle));
            }

            if (Math.abs(ballSpeed.x) < speed * 0.5) {
                ballSpeed.x = Math.sign(ballSpeed.x) * speed * 0.5;
            }

            ballSpeed.normalize().multiplyScalar(speed);
            ballSpeed.multiplyScalar(speedIncreaseFactor);
        }
    });

    ballSpeedX = ballSpeed.x;
    ballSpeedY = ballSpeed.y;

    // Envoyer périodiquement l'état de la balle au serveur
    sendBallState();
}



class AIPlayer extends Player {
    constructor(id, x, y, z) {
        super(id, x, y, z);
        this.targetX = 0;
        this.aiInterval = setInterval(() => this.calculateMovement(), 1000);
    }

    predictBallImpact() {
        let predictedPosition = new THREE.Vector2(sphere.position.x, sphere.position.y);
        let predictedSpeed = new THREE.Vector2(ballSpeedX, ballSpeedY);
        const ballRadius = sphere.geometry.parameters.radius;
        const maxIterations = 1000;
        let iterations = 0;

        while (predictedPosition.y > -wallLength / 2 && predictedPosition.y < wallLength / 2 && iterations < maxIterations) {
            predictedPosition.add(predictedSpeed);

            if (predictedPosition.x - ballRadius <= -wallLength / 2 || predictedPosition.x + ballRadius >= wallLength / 2) {
                predictedSpeed.x *= -1;
            }

            iterations++;
        }

        return predictedPosition.x;
    }

    calculateMovement() {
        this.targetX = this.predictBallImpact();
    }

    update() {
        const speed = 20;
        const aiPosition = this.mesh.position.x;
        const tolerance = 1;

        if (Math.abs(this.targetX - aiPosition) > tolerance) {
            let moveDirection = (this.targetX - aiPosition) > 0 ? speed * delta : -speed * delta;

            let newX = this.mesh.position.x + moveDirection;
            if (newX - this.mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
                newX + this.mesh.geometry.parameters.width / 2 <= wallLength / 2) {
                this.mesh.position.x = newX;
            }
        }

        updatePlayerVisualization();
    }

    destroy() {
        clearInterval(this.aiInterval);
    }
}

// // Function to adjust the camera for the local player
// function adjustCameraForPlayer(player) {
//     const offsetDistance = 15;  // Distance behind the player
//     const height = 10;  // Height of the camera above the player
    
//     camera.position.set(player.mesh.position.x, player.mesh.position.y - offsetDistance, height);
//     camera.lookAt(player.mesh.position.x, player.mesh.position.y, 0);
// }


function animate() {
    requestAnimationFrame(animate);
    delta = clock.getDelta();
    movePlayer(delta);
    moveBall(delta);

    if (useAIForPlayer2 && aiPlayer) {
        aiPlayer.update();
    }

    camera.position.set(0, -15, 10);
    camera.lookAt(0, 0, 0);  //could be in init
    controls.update();
	resizeRendererToDisplaySize(renderer);

    renderer.render(scene, camera);
}


export function receiveSync(id, movementData) {
    console.log(`receiveSync called with id: ${id}, movementData: ${JSON.stringify(movementData)}`);
    let player = players.find(p => p.id === id);
    if (!player) {
        console.log("Creating new player in receiveSync");
        if (!movementData.x) movementData.x = 0;
        if (!movementData.y) movementData.y = 0;
        player = new Player(id, movementData.x, movementData.y * -1, 0);  // Inverser la position y lors de la réception
        players.push(player);
    } else {
        console.log("Updating player position in receiveSync");
        player.mesh.position.x = movementData.x;
        player.mesh.position.y = movementData.y * -1;  // Inverser la position y lors de la réception
    }
    updatePlayerVisualization();
}





export function receiveConnect(id) {
    console.log(`Player connected with id: ${id}`);
    // Optionnel: ajouter une vérification pour ne pas dupliquer les joueurs
}

export function receiveMove(id, movementData) {
    console.log(`receiveMove called with id: ${id}, movementData: ${JSON.stringify(movementData)}`);
    const player = players.find(p => p.id === id);
    if (player) {
        if (movementData.x) player.mesh.position.x += movementData.x;
        if (movementData.y) player.mesh.position.y += movementData.y;
        updatePlayerVisualization();
    } else {
        console.error(`Player with id ${id} not found in receiveMove`);
    }
}

export function sendSync() {
    if (players.length > 0 && players[0].mesh && socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
        let cmd = "sync";
        let x = players[0].mesh.position.x;
        let y = players[0].mesh.position.y * -1;  // Inverser la position y
        let roomId = getRoomId();
        const movementData = { x, y };
        console.log(`Sending sync: ${JSON.stringify({ cmd, movementData, roomId })}`);
        socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
    } else {
        console.error("Player 0 or its mesh is undefined, or WebSocket is not open");
    }
}





export function removePlayer(playerIdToRemove) {
    console.log("Removing player");
    let player = players.find(p => p.id === playerIdToRemove);
    removeMeshFromScene(player.mesh, scene);
    players = players.filter(player => player.id !== playerIdToRemove);
    updatePlayerVisualization();
}

function removeMeshFromScene(mesh, scene) {
    scene.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(material => material.dispose());
        } else {
            mesh.material.dispose();
        }
    }
    if (mesh.material.map) mesh.material.map.dispose();
}

function changeColors({ wallColor, player1Color, player2Color, ballColor }) {
    walls.forEach(wall => {
        wall.material.color.set(wallColor);
    });

    if (players[0]) {
        players[0].mesh.material.color.set(player1Color);
    }

    if (players[1]) {
        players[1].mesh.material.color.set(player2Color);
    }

    sphere.material.color.set(ballColor);
}

function randomizeColors() {
    const randomColor = () => Math.floor(Math.random() * 16777215);

    changeColors({
        wallColor: randomColor(),
        player1Color: randomColor(),
        player2Color: randomColor(),
        ballColor: randomColor()
    });
}

// This function could be called in your animation loop to handle resizing
function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight; // Corrected to use clientHeight for height
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);  // Ensures pixel ratio is considered
        camera.aspect = width / height;          // Ensure the aspect ratio is updated
        camera.updateProjectionMatrix();
    }
    return needResize;
}



animate();
updateScoreDisplay();
