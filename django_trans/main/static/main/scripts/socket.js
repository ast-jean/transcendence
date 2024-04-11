import io from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js';
import { updatePlayerVisualization, animate } from './game.js';
import * as THREE from 'three';

export let socket;
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
        // this.x = x;
        // this.y = y;
        let material = new THREE.MeshBasicMaterial({ color: colors[i++] });
        material.opacity = 0.5; // Example: set the opacity to 50%
        material.transparent = true; // Make sure to set transparent to true to enable opacity
        material.needsUpdate = true;        // Update the material to reflect the changes
        
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1),material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        console.log('New player:', this);
    }
}


// Grab references to your DOM elements
const connectBtn = document.getElementById('connectBtn');

// Connect button click event
connectBtn.addEventListener('click', () => {
    if (!socket || !socket.connected) {
        document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: blue;">Connecting...</span>';
        socket = io('http://localhost:3000', { 
            timeout: 5000, 
            withCredentials: true
        });
        console.log("socket when click",socket);
        setupSocketEventListeners();
    } else {
        socket.disconnect();
    }
});

function removePlayer(playerIdToRemove) {
    players = players.filter(player => player.id !== playerIdToRemove);
}

function updatePlayerPosition(id, x, y) {
    const player = players.find(p => p.id === id);
    if (player) {
        console.log("change player data");
        player.mesh.position.x += x;
        player.mesh.position.y += y;
    } else {
        console.log("create new player");
        players.push(new Player(id, x, y));
    }
}

let renderLoopRunning = false;
function setupSocketEventListeners()
{
    socket.on('connect', () => {
        console.log('Successfully connected to the server.');
        connectBtn.textContent = 'Disconnect'; // Change button text to 'Disconnect'
        document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: green;">Connected</span>';
        players.push(new Player(socket.id,0,0));

        if (!renderLoopRunning) {
            animate();
            renderLoopRunning = true;
        }
    
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from the server.');
        connectBtn.textContent = 'Connect'; // Change button text back to 'Connect'
        document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: red;">Disconnected</span>';
        socket.emit('disconnectFromServer');
        players = [];
    });


    socket.on('clientDisconnected', (data) => {
        console.log(data, ' from the server.');
        removePlayer(data.id);
    });

    socket.on('initPlayersLocation', (data) => {
        const player = players.find(p => p.id === id);
        if (player) {
            // console.log("change player data");
            player.mesh.position.x = data.x;
            player.mesh.position.y = data.y;
        } else {
            // console.log("create new player");
            players.push(new Player(id, data.x, data.y));
        }
    });

    // Event listener for connection errors
    socket.on('connect_error', (error) => {
        console.error('Connection failed:', error);
        document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: red;">Disconnected</span>';
    });

    // Optionally handle the 'connect_timeout' event
    socket.on('connect_timeout', (timeout) => {
        console.log('Connection timed out after', timeout, 'ms');
        document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: red;">Disconnected</span>';
    });

    // Additional event listeners for game logic
    socket.on('sendPositionToClients', (data) => {
        // console.log('Position update received:', data);
        updatePlayerPosition(data.id, data.x, data.y);
        updatePlayerVisualization();
        
    });

};
