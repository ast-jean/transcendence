import * as THREE from 'three';
import { socket } from './socket_pong.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var clock = new THREE.Clock();
let ballSpeedX = 0;
let ballSpeedY = 0;
let useAIForPlayer2 = false;


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

var localplay = document.getElementById("localplay_btn");
localplay.addEventListener("click", localgame);



function hideChat() {
    const chat = document.getElementById('chat-container'); // Sélectionner l'élément du chat
    if (chat) {
        chat.style.display = 'none'; // Masquer le chat
    }
    startCountdown();
}

const localPlayButton = document.getElementById('localplay_btn');
const versusAIButton = document.getElementById('versusai_btn');

if (localPlayButton) {
    localPlayButton.addEventListener('click', () => {
        hideChat();
        localgame(false); // Mode jeu local sans IA
    });
}

if (versusAIButton) {
    versusAIButton.addEventListener('click', () => {
        hideChat();
        localgame(true); // Mode jeu avec IA pour le joueur 2
    });
}

function hideAllButtons() {
    const buttons = document.querySelectorAll('.game-button');
    buttons.forEach(button => button.classList.add('hidden'));
}

document.querySelectorAll('.game-button').forEach(button => {
    button.addEventListener('click', hideAllButtons);
});


function startCountdown() {
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
            ballSpeedX = 10;
            ballSpeedY = 10;
        } else {
            countdownContainer.textContent = countdown;
        }
    }, 1000);
}



const wallThickness = 0.5;
const wallLength = 20;
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
function localgame(useAI) {
    console.log("in localgame function", index);

    // Réinitialiser la liste des joueurs et la scène
    players.forEach(player => scene.remove(player.mesh));
    players = [];
    if (aiPlayer) {
        scene.remove(aiPlayer.mesh); // Retirer l'IA si elle existe
    }

    let player1 = new Player(1, 0, -wallLength / 2 + 1, 0);
    players.push(player1);
    scene.add(player1.mesh);

    if (useAI) {
        aiPlayer = new AIPlayer(2, 0, wallLength / 2 - 1, 0);
        players.push(aiPlayer); // Ajouter le paddle de l'IA à la liste des joueurs
        scene.add(aiPlayer.mesh);
        useAIForPlayer2 = true;
    } else {
        let player2 = new Player(2, 0, wallLength / 2 - 1, 0);
        players.push(player2);
        scene.add(player2.mesh);
        useAIForPlayer2 = false;
    }

    updatePlayerVisualization();
}





// Resize game window on window resize
// window.addEventListener('resize', onWindowResize, false);

// const axesHelper = new THREE.AxesHelper(10);
// scene.add(axesHelper);

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

let colors = [
    0x00ff00, // Green
    0x0000ff, // Blue
    0xff0000, // Red
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
    if (players.length > 0) {
        players.forEach(player => {
            scene.add(player.mesh);
        });
    }
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
    ballSpeedX = 0;
    ballSpeedY = 0;

    const winner = player1Score >= maxScore ? 'Player 1' : 'Player 2';
    const endGameMessage = document.createElement('div');
    endGameMessage.id = 'end-game-message';
    endGameMessage.style.position = 'absolute';
    endGameMessage.style.top = '50%';
    endGameMessage.style.left = '50%';
    endGameMessage.style.transform = 'translate(-50%, -50%)';
    endGameMessage.style.fontSize = '2em';
    endGameMessage.style.color = '#fff';
    endGameMessage.innerHTML = `
        ${winner} wins!<br>
    `;
    document.body.appendChild(endGameMessage);

    // Afficher les boutons Replay et Menu
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
        resetGame();
        controls.enabled = false;
    });
}

function resetGame() {
    player1Score = 0;
    player2Score = 0;
    ballSpeedX = 0;
    ballSpeedY = 0;
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


// Lumières directionnelles
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(0, 20, 10);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1);
fillLight.position.set(-10, 10, 10);
scene.add(fillLight);

// Lumière ambiante
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Lumière ponctuelle près de la balle
const ballLight = new THREE.PointLight(0xffffff, 1.5, 50);
ballLight.position.set(0, 0, 5);
scene.add(ballLight);

// The parameters are: radius, widthSegments, heightSegments
const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0, 0, 0);
scene.add(sphere);

export var delta;

var keyState = {};

document.addEventListener('keydown', function (e) {
    if (['ArrowLeft', 'ArrowRight', 'KeyA','KeyD'].includes(e.code)) {
        keyState[e.code] = true;
        e.preventDefault();
    }
}, true);

document.addEventListener('keyup', function (e) {
    if (['ArrowLeft','ArrowRight','KeyA',  'KeyD'].includes(e.code)) {
        keyState[e.code] = false;
        e.preventDefault();
    }
}, true);

export function movePlayer(delta) {
    const speed = 20;
    let x1 = 0;
    let x2 = 0;

    if (keyState['ArrowLeft']) x1 -= speed * delta;
    if (keyState['ArrowRight']) x1 += speed * delta;
    if (keyState['KeyA']) x2 -= speed * delta;
    if (keyState['KeyD']) x2 += speed * delta;

    if (x1 !== 0) {
        let newX = players[0].mesh.position.x + x1;
        if (newX - players[0].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
            newX + players[0].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
            players[0].mesh.position.x = newX;
        }
        if (socket && socket.readyState) {
            let cmd = "move";
            const movementData = { x: x1, y: 0 };
            socket.send(JSON.stringify({ cmd, movementData }));
        }
    }

    if (x2 !== 0) {
        let newX = players[1].mesh.position.x + x2;
        if (newX - players[1].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
            newX + players[1].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
            players[1].mesh.position.x = newX;
        }
        if (socket && socket.readyState) {
            let cmd = "move";
            const movementData = { x: x2, y: 0 };
            socket.send(JSON.stringify({ cmd, movementData }));
        }
    }

    updatePlayerVisualization();
}


function moveBall(delta) {
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
}

let aiPlayer = null;

export function animate() {
    requestAnimationFrame(animate);
    delta = clock.getDelta();
    movePlayer(delta);
    moveBall(delta);

    if (useAIForPlayer2 && aiPlayer) {
        aiPlayer.update(sphere.position);
    }

    camera.position.set(0, -15, 10);
    camera.lookAt(0, 0, 0); 
    controls.update();
    renderer.render(scene, camera);
}






export function receiveMove(id, movementData) {
    const player = players.find(p => p.id === id);
    if (player) {
        if (movementData) {
            if (movementData.x) player.mesh.position.x += movementData.x;
            if (movementData.y) player.mesh.position.y += movementData.y;
        }
    } else {
        console.log("Player doesn't exist, creating one");
        if (!movementData.x) movementData.x = 0;
        players.push(new Player(id, movementData.x, movementData.y, 0));
        if (!movementData.y) movementData.y = 0;
    }
    updatePlayerVisualization();
}

export function receiveSync(id, movementData) {
    const player = players.find(p => p.id === id);
    if (!player) {
        if (!movementData.x) movementData.x = 0;
        if (!movementData.y) movementData.y = 0;
        players.push(new Player(id, movementData.x, movementData.y, 0));
    }
    updatePlayerVisualization();
}

export function sendSync() {
    let cmd = "sync";
    let x = players[0].mesh.position.x;
    let y = players[0].mesh.position.y;
    const movementData = { x, y };
    socket.send(JSON.stringify({ cmd, movementData }));
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



class AIPlayer {
    constructor(id, x, y, z) {
        this.id = id;
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        this.mesh.position.set(x, y, z);
        this.speed = 5;
    }

    update(ballPosition) {
        // Implémentez une logique simple pour l'IA, par exemple se déplacer vers la balle
        if (ballPosition.x > this.mesh.position.x) {
            this.mesh.position.x += this.speed;
        } else if (ballPosition.x < this.mesh.position.x) {
            this.mesh.position.x -= this.speed;
        }

        // Contraindre la position de l'IA dans les limites du terrain
        if (this.mesh.position.x < -wallLength / 2 + 2.5) {
            this.mesh.position.x = -wallLength / 2 + 2.5;
        } else if (this.mesh.position.x > wallLength / 2 - 2.5) {
            this.mesh.position.x = wallLength / 2 - 2.5;
        }
    }
}





// const aiPlayer = new AIPlayer(2, 0, wallLength / 2 - 1, 0);
// scene.add(aiPlayer.mesh);

AIPlayer.prototype.move = function(ballPosition) {
    const anticipatedY = this.anticipate(ballPosition);
    if (anticipatedY > this.mesh.position.y) {
        this.mesh.position.y += this.speed;
    } else if (anticipatedY < this.mesh.position.y) {
        this.mesh.position.y -= this.speed;
    }
};

AIPlayer.prototype.anticipate = function(ballPosition) {
    // Logique simple pour anticiper la position future de la balle
    const ballSpeed = 10; // Exemple de vitesse de la balle
    const timeToImpact = (this.mesh.position.y - ballPosition.y) / ballSpeed;
    return ballPosition.y + timeToImpact * ballSpeed;
};




animate();
updateScoreDisplay();
