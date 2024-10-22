import { Player, AIPlayer} from "../gameplay/player.js";
import { scene } from "../pong.js";
import { Tournament } from "../tournament/tournament.js";

export let ballSpeedX = 0;
export let ballSpeedY = 0;
export let players = [];
export let isGameOver = true;
export let isFourPlayerMode = false;
export let tournament;
export let localPlayerId = null;


export function setID(value){
    localPlayerId = value;
}

export function setPlayerMode(value){
    isFourPlayerMode = value;
}

export function setBallSpeedX(value) {
    ballSpeedX = value;
}

export function setBallSpeedY(value) {
    ballSpeedY = value;
}

export function getBallSpeedX() {
    return ballSpeedX;
}

export function getBallSpeedY() {
    return ballSpeedY;
}

export function setGameOverState(state) {
    isGameOver = state;
}

// Ajoute un joueur dans le tableau global players et à la scène
export function addPlayerToGame(id, x, y, z, color, scene, AI = false, isVertical = false, name = null) {
    if (AI) {
        // Ajouter un joueur IA
        const newAIPlayer = new AIPlayer(id, x, y, z, color, false, 'AI');
        players.push(newAIPlayer);
    } else {
        // Ajouter un joueur humain
        const newPlayer = new Player(id, x, y, z, color, isVertical, name);
        players.push(newPlayer);
    }
}

// Supprime tous les joueurs existants de la scène
export function removeAllPlayers(scene) {
    players.forEach(player => scene.remove(player.mesh));  // Supprime les joueurs de la scène
    players = [];  // Réinitialise le tableau de joueurs
}

export function removePlayer(playerIdToRemove) {
    console.log("Removing player");
    let player = players.find(p => p.id === playerIdToRemove);
    if (player){
        removeMeshFromScene(player.mesh, scene);
        players = players.filter(player => player.ident !== playerIdToRemove);
    } 
}

export function setTournament(tournamentId, maxPlayers)
{
    tournament = new Tournament(tournamentId, maxPlayers);
} 