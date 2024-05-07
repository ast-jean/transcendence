import { updatePlayerVisualization, animate, players } from './game.js';
import * as THREE from 'three';

const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
const ws_path = `${ws_scheme}://${window.location.host}/ws/pong/`;
export const socket = new WebSocket(ws_path);

socket.addEventListener('open', function (event) {
    socket.send(JSON.stringify({ message: 'Hello Server!' }));
});

socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
});

// const form = document.getElementById('messageForm');
// form.addEventListener('submit', function (event) {
//     event.preventDefault();
//     const messageInput = document.getElementById('messageInput');
//     const message = messageInput.value;
//     socket.send(JSON.stringify({ message: message }));
//     messageInput.value = '';
//     messageInput.focus();
// });


//XXXXXXXXXXXXXXXXXX
// Grab references to your DOM elements
// const connectBtn = document.getElementById('connectBtn');

// // Connect button click event
// connectBtn.addEventListener('click', () => {
//     if (!socket || !socket.connected) {
//         document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: blue;">Connecting...</span>';
//         // socket = io('http://localhost:3000', { 
//         //     timeout: 5000, 
//         //     withCredentials: true
//         // });
//         console.log("socket when click",socket);
//         setupSocketEventListeners();
//     } else {
//         socket.disconnect();
//     }
// });

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


function setupSocketEventListeners()
{
    // const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const ws_path = `ws://${window.location.hostname}/ws/game`;
    // const ws_path = `${ws_scheme}://${window.location.hostname}:55582/ws/game/`;
    socket = new WebSocket(ws_path);

    socket.onopen = function(e) {
        console.log('Successfully connected to the server.');
        socket.send(JSON.stringify({
            'message': 'Hello Server!'
        }));
        // connectBtn.textContent = 'Disconnect'; // Change button text to 'Disconnect'
        // document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: green;">Connected</span>';
 
    }
    socket.onerror = function(error) {
        console.error('WebSocket Error: ' + error);
    };
    
    socket.onclose = function(event) {
        console.log('WebSocket connection closed:', event);
        document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: red;">Disconnected</span>';
        connectBtn.textContent = 'Connect'; // Change button text back to 'Connect'
    };
    
    socket.onmessage = function(event) {
        console.log('Message from server ', event.data);
    };

    document.getElementById('sendBtn').addEventListener('click', function() {
        const message = { action: 'sendMessage', data: 'Hello, server!' };
        socket.send(JSON.stringify(message));
    });
    // socket.on('connect', () => {
    //     console.log('Successfully connected to the server.');
    //     connectBtn.textContent = 'Disconnect'; // Change button text to 'Disconnect'
    //     document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: green;">Connected</span>';
    //     players.push(new Player(socket.id,0,0));

    //     if (!renderLoopRunning) {
    //         animate();
    //         renderLoopRunning = true;
    //     }
    
    // });

    // socket.on('disconnect', () => {
    //     console.log('Disconnected from the server.');
    //     connectBtn.textContent = 'Connect'; // Change button text back to 'Connect'
    //     document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: red;">Disconnected</span>';
    //     socket.emit('disconnectFromServer');
    //     players = [];
    // });


    // socket.on('clientDisconnected', (data) => {
    //     console.log(data, ' from the server.');
    //     removePlayer(data.id);
    // });

    // socket.on('initPlayersLocation', (data) => {
    //     const player = players.find(p => p.id === id);
    //     if (player) {
    //         // console.log("change player data");
    //         player.mesh.position.x = data.x;
    //         player.mesh.position.y = data.y;
    //     } else {
    //         // console.log("create new player");
    //         players.push(new Player(id, data.x, data.y));
    //     }
    // });

    // // Event listener for connection errors
    // socket.on('connect_error', (error) => {
    //     console.error('Connection failed:', error);
    //     document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: red;">Disconnected</span>';
    // });

    // // Optionally handle the 'connect_timeout' event
    // socket.on('connect_timeout', (timeout) => {
    //     console.log('Connection timed out after', timeout, 'ms');
    //     document.getElementById('ServerStatus').innerHTML = 'Server Status : <span style="color: red;">Disconnected</span>';
    // });

    // // Additional event listeners for game logic
    // socket.on('sendPositionToClients', (data) => {
    //     // console.log('Position update received:', data);
        // updatePlayerPosition(data.id, data.x, data.y);
        // updatePlayerVisualization();
        
    // });

};
