import { players, ballSpeedX, ballSpeedY, localPlayerId } from "./setter.js";
import { socketState } from "../websockets/socket_pong.js";
import { room_id } from "../websockets/socket_pong.js";
import { sphere } from "../gameplay/ball.js";
import { wallLength, walls } from "../gameplay/wall.js";
import { tournament } from "./setter.js";
import { hideBtn, showBtn } from "../ui/ui_updates.js";

export function removeMeshFromScene(mesh, scene) {
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

export function displayDebugInfo() {
    console.log("%c--- Debug Information ---", "color: #00ff00; font-weight: bold;");

    // Afficher la liste des joueurs
    if (players && players.length > 0) {
        console.log("%cPlayers Connected:", "color: #00ffff; font-weight: bold;");
        players.forEach((player, index) => {
            console.log(`Player ${index + 1} - ID: ${player.ident}, Position: (${player.mesh.position.x.toFixed(2)}, ${player.mesh.position.y.toFixed(2)}, ${player.mesh.position.z.toFixed(2)})`);
        });
    } else {
        console.log("%cNo players connected.", "color: #ff0000; font-weight: bold;");
    }

    // Afficher l'état du WebSocket
    console.log("%cWebSocket Status:", "color: #00ffff; font-weight: bold;");
    if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
        console.log("%cConnected", "color: #00ff00;");
    } else if (socketState.socket && socketState.socket.readyState === WebSocket.CONNECTING) {
        console.log("%cConnecting...", "color: #ffff00;");
    } else {
        console.log("%cDisconnected", "color: #ff0000;");
    }

    // Afficher l'ID de la room si disponible
    if (room_id) {
        console.log(`%cRoom ID: ${room_id}`, "color: #00f0ff;");
    } else {
        console.log("%cRoom ID not set.", "color: #ff0000;");
    }

    // Afficher d'autres informations utiles (ex: vitesse de la balle, état des murs, etc.)
    if (sphere) {
        console.log("%cBall Info:", "color: #00ffff; font-weight: bold;");
        console.log(`Position: (${sphere.position.x.toFixed(2)}, ${sphere.position.y.toFixed(2)}, ${sphere.position.z.toFixed(2)})`);
        console.log(`Speed: X=${ballSpeedX.toFixed(2)}, Y=${ballSpeedY.toFixed(2)}`);
    }

    // Afficher les informations sur les murs
    if (walls && walls.length > 0) {
        console.log("%cWalls Info:", "color: #00ffff; font-weight: bold;");
        walls.forEach((wall, index) => {
            console.log(`Wall ${index + 1} - Position: (${wall.position.x.toFixed(2)}, ${wall.position.y.toFixed(2)}, ${wall.position.z.toFixed(2)})`);
        });
    } else {
        console.log("%cNo walls defined.", "color: #ff0000;");
    }

    // Afficher les informations spécifiques au tournoi
    if (tournament) {
        console.log("%cTournament Info:", "color: #00ffff; font-weight: bold;");
        console.log(`Tournament ID: ${tournament.tournamentId}`);
        console.log(`Max Players: ${tournament.maxPlayers}`);
        console.log(`Players Registered: ${tournament.players.length}`);
        tournament.players.forEach((player, index) => {
            console.log(`Player ${index + 1}: ${player.ident}`);
        });
        console.log(`Is Lobby: ${tournament.isLobby}`);
        if (tournament.matches.length > 0) {
            console.log(`Matches in Progress: ${tournament.matches.length}`);
            tournament.matches.forEach((match, index) => {
                console.log(`Match ${index + 1} - Player 1: ${match.player1.id}, Player 2: ${match.player2.id}, Winner: ${match.winner ? match.winner.id : "TBD"}`);
            });
        }
    } else {
        console.log("%cNo tournament information available.", "color: #ff0000;");
    }

    // Envoyer une commande au backend pour obtenir des informations supplémentaires
    if (socketState.socket && socketState.socket.readyState === WebSocket.OPEN) {
        console.log("%cRequesting backend info...", "color: #00ffff; font-weight: bold;");
        let cmd = "getBackendInfo";
        socketState.socket.send(JSON.stringify({ cmd, room_id }));
    }

    console.log("%c--------------------------", "color: #00ff00; font-weight: bold;");
}


export function getPlayerStartingPosition(playerId) {
    const positions = [
        {x: 0, y: -wallLength / 2 + 0.5, z: 0},  // Bas (joueur 1)
        {x: 0, y: wallLength / 2 - 0.5, z: 0},   // Haut (joueur 2)
        {x: -wallLength / 2 + 0.5, y: 0, z: 0},  // Gauche (joueur 3)
        {x: wallLength / 2 - 0.5, y: 0, z: 0}    // Droite (joueur 4)
    ];
    return positions[parseInt(playerId) % 4];  // Simple logique pour distribuer les joueurs
}

export function determineIfVertical(playerId) {
    // Suppose que les joueurs 1 et 2 sont horizontaux (bas et haut) et 3 et 4 sont verticaux (gauche et droite)
    return playerId === 3 || playerId === 4;
}

export function connectPlayersInRoom(roomId, players) {
    console.log(`Connexion des joueurs dans la Room ID ${roomId}...`);

    // Envoie l'information de connexion à chaque joueur
    players.forEach(playerId => {
        const cmd = {
            cmd: "connectPlayer",
            roomId: roomId,
            playerId: playerId
        };
        socketState.socket.send(JSON.stringify(cmd));
    });
}


export function getNewPlayerPosition(playerCount) {
    // Diviser les joueurs sur 4 côtés du mur en fonction de leur nombre
    const positions = [
        {x: 0, y: wallLength / 2 - 0.5},  // Position du joueur 1 (bas)
        {x: 0, y: -(wallLength / 2 - 0.5)}, // Position du joueur 2 (haut)
        {x: -(wallLength / 2 - 0.5), y: 0}, // Position du joueur 3 (gauche)
        {x: wallLength / 2 - 0.5, y: 0},    // Position du joueur 4 (droite)
    ];

    return positions[playerCount % positions.length];  // Retourne une position en fonction du nombre de joueurs
}

export function getNewPlayerColor(playerCount) {
    // Exemple de couleurs pour chaque joueur
    const colors = [0x0000ff, 0x00ffff, 0xff0000, 0x00ff00];
    return colors[playerCount % colors.length];  // Retourne une couleur en fonction du nombre de joueurs
}

export function isPositionValid(x, y) {
    // Vérifie si la nouvelle position est valide en fonction de la longueur des murs, etc.
    // Par exemple :
    if (x < -wallLength / 2 || x > wallLength / 2 || y < -wallLength / 2 || y > wallLength / 2) {
        return false; // Le mouvement va traverser les murs
    }
    return true; // Le mouvement est valide
}

// Fonction pour vérifier si l'utilisateur est l'hôte en comparant les ID
export function checkIfHost(hostId) {
    console.log("localPlayerId:" + localPlayerId);
    console.log("hostId:" + hostId);
    if (localPlayerId === hostId) {
        showBtn('start_btn');  // Affiche le bouton si l'ID local correspond à l'ID de l'hôte
        console.log("Vous êtes l'hôte, bouton start visible.");
    } else {
        hideBtn('start_btn');  // Cache le bouton si l'ID local ne correspond pas à l'ID de l'hôte
        console.log("Vous n'êtes pas l'hôte, bouton start caché.");
    }
}

export function endMatch(winnerId) {
    const cmd = "endMatch";
    const roomId = getRoomId(); // ID de la room actuelle
    const data = {
        cmd,
        roomId,
        winnerId
    };
    
    socketState.socket.send(JSON.stringify(data));
    console.log(`Fin du match, gagnant : ${winnerId}`);
}