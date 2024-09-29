import { players, ballSpeedX, ballSpeedY } from "./setter.js";
import { socketState } from "../websockets/socket_pong.js";
import { room_id } from "../websockets/socket_pong.js";
import { sphere } from "../gameplay/ball.js";
import { walls } from "../gameplay/wall.js";
import { tournament } from "./setter.js";

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
