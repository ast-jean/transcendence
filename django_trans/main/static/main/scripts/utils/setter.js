import { Player, AIPlayer} from "../gameplay/player.js";
import { scene } from "../pong.js";
import { Tournament } from "../tournament/tournament.js";

export let ballSpeedX = 0;
export let ballSpeedY = 0;
export let players = [];
export let isGameOver = true;
export let isFourPlayerMode = false;
export let isLocalMode = false;
export let tournament;
export let localPlayerId = null;
export let modal = new bootstrap.Modal(document.getElementById('exampleModal')); 
export var room_id;
export let isTournament = false;
export let ping_id = 0;

export function setPingId(){
    ping_id++;
}

export function setPingIdI(i){
    i++;
}


export function setID(value){
    localPlayerId = value;
}

export function setPlayerMode(value){
    isFourPlayerMode = value;
}

export function setLocalMode(value){
    isLocalMode = value;
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

export function setIsTournament(value)
{
    isTournament = value;
}

// Ajoute un joueur dans le tableau global players et à la scène
export function addPlayerToGame(id, x, y, z, color, scene, AI = false, isVertical = false, name = null, alias = null) {
    if (AI) {
        // Ajouter un joueur IA
        const newAIPlayer = new AIPlayer(id, x, y, z, color, false, 'AI');
        players.push(newAIPlayer);
    } else {
        // Ajouter un joueur humain
        const newPlayer = new Player(id, x, y, z, color, isVertical, name, alias);
        players.push(newPlayer);
    }
}

// Supprime tous les joueurs existants de la scène
export function removeAllPlayers(scene) {
    players.forEach(player => scene.remove(player.mesh));  // Supprime les joueurs de la scène
    players = [];  // Réinitialise le tableau de joueurs
}

export function removePlayer(playerIdToRemove) {
    //console.log("Removing player");
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

export function setPlayers(src) {
    players = src;
}

export function setPlayerName(ident, name) {
    players.forEach(player => {
        if (player.ident === ident) {
            player.name = name;
        }
    });
} 

export function setPlayerAlias(ident, alias) {
    players.forEach(player => {
        if (player.ident === ident) {
            player.alias = alias;
        }
    });
} 

export function setRoomId(roomId)
{
    room_id = roomId;
}