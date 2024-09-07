import * as THREE from 'three';
import { socketState, sendSync } from '../websockets/socket_pong.js'; // Synchronisation des mouvements des joueurs
import { wallLength } from './walls.js'; // Pour les limites du terrain
import { updatePlayerVisualization } from './visualization.js'; // Si tu mets à jour les visuels des joueurs


export let players = [];

export class Player {
    constructor(id, x, y, z, color) {
        this.id = id;
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ color: color })
        );
        this.mesh.position.set(x, y, z);
    }
}

export function initializePlayers(playerData) {
    players.forEach(player => scene.remove(player.mesh));
    players = [];
    
    playerData.forEach(data => {
        const player = new Player(data.id, data.x, data.y, data.z, data.color);
        players.push(player);
        scene.add(player.mesh);
    });
}

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

function resetPlayer() {
    let local_player = new Player(1, 0, -wallLength / 2 + 0.5, 0);
    players.push(local_player);
    scene.add(local_player.mesh);
    
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