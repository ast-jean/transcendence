import * as THREE from 'three';
import { getRoomId, socketState } from '../websockets/socket_pong.js'; // Synchronisation des mouvements des joueurs
import { wallLength } from './wall.js'; // Pour les limites du terrain
import { local_game, scene } from '../pong.js';
import { addPlayerToGame, removeAllPlayers, players, getBallSpeedX, getBallSpeedY, isFourPlayerMode } from '../utils/setter.js';
import { sphere } from './ball.js';

export let keyState = {};

export class Player {
    constructor(ident, x, y, z, color, isVertical) {
        this.ident = ident;
        this.lives = 3;
        this.isVertical = isVertical;

        // Choisir la géométrie en fonction de l'orientation (vertical ou horizontal)
        const geometry = this.isVertical
            ? new THREE.BoxGeometry(0.5, 5, 0.5) // Vertical: hauteur plus grande
            : new THREE.BoxGeometry(5, 0.5, 0.5); // Horizontal: largeur plus grande

        this.mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({ color: color })
        );
        this.mesh.position.set(x, y, z);

    }
        loseLife() {
            this.lives -= 1;
            if (this.lives <= 0) {
                this.mesh.material.color.setHex(0x808080);  // Change to grey when no more lives
            }
        }
    
        isAlive() {
            return this.lives > 0;
        }
}

// Fonction pour initialiser les joueurs sur leurs positions respectives avec le flag isVertical
export function initializePlayers4() {

    removeAllPlayers(scene);

    // Joueur 1 - Bas (horizontal)
    const player1 = new Player(1, 0, -wallLength / 2 + 0.5, 0, 0x00ff00, false);

    // Joueur 2 - Haut (horizontal)
    const player2 = new Player(2, 0, wallLength / 2 - 0.5 , 0, 0x0000ff, false);

    // Joueur 3 - Gauche (vertical)
    const player3 = new Player(3, -wallLength / 2 + 0.5, 0, 0, 0xff0000, true);

    // Joueur 4 - Droite (vertical)
    const player4 = new Player(4, wallLength / 2 - 0.5, 0, 0, 0xffff00, true);

    // Ajouter les joueurs à la liste globale
    players.push(player1, player2, player3, player4);
}




// Initialisation des joueurs (locale ou avec IA)
export function initializePlayers(scene, useAI, isOnline ) {
    removeAllPlayers(scene);  // Retire tous les joueurs existants

    // Ajoute le premier joueur
    addPlayerToGame(1, 0, -wallLength / 2 + 0.5, 0, 0x00ff00, scene); // Joueur 1 (vert)
    if (!isOnline)
    {
        if (useAI) {
            // Ajoute un joueur IA
            addPlayerToGame(2, 0, wallLength / 2 - 0.5, 0, 0xff0000, scene, true); // IA (rouge)
        } else {
            // Ajoute un deuxième joueur humain
            addPlayerToGame(2, 0, wallLength / 2 - 0.5, 0, 0x0000ff, scene); // Joueur 2 (bleu)
        }
    }
}


// Fonction pour déplacer un joueur sur l'axe X (horizontal)
function movePlayerHorizontal(player, delta, speed, direction, socketSync = false) {
    let newX = player.mesh.position.x + direction * speed * delta;
    
    // Vérification des limites pour ne pas sortir du mur
    if (newX - player.mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
        newX + player.mesh.geometry.parameters.width / 2 <= wallLength / 2) {
        player.mesh.position.x = newX;
        
        // Synchroniser les données en ligne si nécessaire
        if (socketSync && socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
            let cmd = "move";
            const movementData = { x: direction * speed * delta, y: 0 };
            let roomId = getRoomId();
            socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
        }
    }
}

// Fonction pour déplacer un joueur sur l'axe Y (vertical)
function movePlayerVertical(player, delta, speed, direction, socketSync = false) {
    let newY = player.mesh.position.y + direction * speed * delta;
    
    // Vérification des limites pour ne pas sortir du mur
    if (newY - player.mesh.geometry.parameters.height / 2 >= -wallLength / 2 &&
        newY + player.mesh.geometry.parameters.height / 2 <= wallLength / 2) {
        player.mesh.position.y = newY;
        
        // Synchroniser les données en ligne si nécessaire
        if (socketSync && socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
            let cmd = "move";
            const movementData = { x: 0, y: direction * speed * delta };
            let roomId = getRoomId();
            socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
        }
    }
}

// Fonction principale pour déplacer les joueurs
export function movePlayer4(delta) {
    const speed = 20;

    // Déplacer le joueur 1 (horizontal)
    if (players[0] && !players[0].isVertical) {
        let xDirection = 0;
        if (keyState['ArrowLeft']) xDirection = -1;
        if (keyState['ArrowRight']) xDirection = 1;
        if (xDirection !== 0) {
            movePlayerHorizontal(players[0], delta, speed, xDirection, true);
        }
    }

    // Déplacer le joueur 2 (horizontal)
    if (players[1] && !players[1].isVertical) {
        let xDirection = 0;
        if (keyState['KeyA']) xDirection = -1;
        if (keyState['KeyD']) xDirection = 1;
        if (xDirection !== 0) {
            movePlayerHorizontal(players[1], delta, speed, xDirection, true);
        }
    }

    // Déplacer le joueur 3 (vertical)
    if (players[2] && players[2].isVertical) {
        let yDirection = 0;
        if (keyState['ArrowUp']) yDirection = 1;
        if (keyState['ArrowDown']) yDirection = -1;
        if (yDirection !== 0) {
            movePlayerVertical(players[2], delta, speed, yDirection, true);
        }
    }

    // Déplacer le joueur 4 (vertical)
    if (players[3] && players[3].isVertical) {
        let yDirection = 0;
        if (keyState['KeyW']) yDirection = 1;
        if (keyState['KeyS']) yDirection = -1;
        if (yDirection !== 0) {
            movePlayerVertical(players[3], delta, speed, yDirection, true);
        }
    }
}





 //Fonction pour déplacer les joueurs
export function movePlayer(delta, scene) {

    if (isFourPlayerMode){
        movePlayer4(delta);
        return ;
    }
    const speed = 20;
    let x1 = 0, x2 = 0;

    if (players[0]) {        
        if (keyState['ArrowLeft']) x1 -= speed * delta;
        if (keyState['ArrowRight']) x1 += speed * delta;

        if (local_game) {
            if (keyState['KeyA']) x2 -= speed * delta;
            if (keyState['KeyD']) x2 += speed * delta;
        }

        // Mise à jour de la position du joueur 1
        if (x1 !== 0) {
            let newX = players[0].mesh.position.x + x1;
            if (newX - players[0].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
                newX + players[0].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
                players[0].mesh.position.x = newX;
                // Envoi des données de mouvement en ligne
                if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
                    let cmd = "move";
                    const movementData = { x: x1, y: 0 };
                    let roomId = getRoomId();
                    socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
                }
            }
        }

        // Mise à jour de la position du joueur 2
        if (x2 !== 0) {
            let newX = players[1].mesh.position.x + x2;
            if (newX - players[1].mesh.geometry.parameters.width / 2 >= -wallLength / 2 &&
                newX + players[1].mesh.geometry.parameters.width / 2 <= wallLength / 2) {
                players[1].mesh.position.x = newX;
                // Envoi des données de mouvement en ligne
                if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
                    let cmd = "move";
                    const movementData = { x: x2 * -1, y: 0 };
                    let roomId = getRoomId();
                    socketState.socket.send(JSON.stringify({ cmd, movementData, roomId }));
                }
            }
        }
    }
}

// Met à jour l'affichage des joueurs
export function updatePlayerVisualization(scene) {
    players.forEach(player => {
        scene.add(player.mesh);
    });
}

export function resetPlayer() {
    // let local_player = new Player(1, 0, -wallLength / 2 + 0.5, 0);
    // players.push(local_player);
    // scene.add(local_player.mesh);
}

// Gestion des événements de touche
document.addEventListener('keydown', function (e) {
    keyState[e.code] = true; // Marque la touche comme enfoncée
});

document.addEventListener('keyup', function (e) {
    keyState[e.code] = false; // Marque la touche comme relâchée
});

export class AIPlayer extends Player {
    constructor(ident, x, y, z, color) {
        console.log('AIPlayer is being initialized');
        super(ident, x, y, z, color);
        this.targetX = 0;
        this.aiInterval = setInterval(() => this.calculateMovement(), 1000);
    }

    predictBallImpact() {
        let predictedPosition = new THREE.Vector2(sphere.position.x, sphere.position.y);
        let predictedSpeed = new THREE.Vector2(getBallSpeedX(), getBallSpeedY());
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

    update(delta) {
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
    }

    destroy() {
        clearInterval(this.aiInterval);
    }
}