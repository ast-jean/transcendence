const socketIo = require('socket.io');
// const fs = require('fs');

const http = require('http');

const server = http.createServer();

// class Game {
//     constructor(id, playerlist, chat) {
//         gameid = id;
//         players = playerlist;        
//         Chat = chat;
//     }
// }



class Player {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
    }
}

let players = [];

function removePlayer(playerIdToRemove) {
    players = players.filter(player => player.id !== playerIdToRemove);
}

const io = socketIo(server, {
    cors: {
        origin: ["https://localhost:55582", "https://localhost:54326"],// Adjust as needed for your client's origin Ex: vscode forwarded port
        methods: ["GET", "POST"],  // Allowed HTTP request methods for CORS
        credentials: true,  // Allow cookies and authenticated connections
      }
  });


function initPlayersLocation(socket) {
    players.forEach(player => {
        socket.broadcast.emit('sendPositionToClients', {id: player.id, x:player.x, y:player.y});
    });
}

// Your Socket.IO setup here...
io.on('connection', (socket) => {
    console.log('A client connected',' PlayerList: ' ,players);
    players.push(new Player(socket.id, 0, 0));
    initPlayersLocation(socket);


    // Don't forget to handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
        removePlayer(socket.id);
        console.log('A client connected',' PlayerList: ' ,players);
        socket.broadcast.emit('clientDisconnected', {id: socket.id});
    });

    socket.on('sendPositionToServer', (data) => {
        const player = players.find(p => p.id === socket.id);
        // console.log("XXXXX--FIND ID--XXXXX", player);
        console.log("XXXXX--Players--XXXXX", players);
        if (player) {
            player.x += data.x;
            player.y += data.y;
        }
        socket.broadcast.emit('sendPositionToClients', {id: socket.id, x:data.x, y:data.y});
    });

});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});
