

export let ballSpeedX = 0;
export let ballSpeedY = 0;
export let players = [];
export let isGameOver = true;

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
export function addPlayerToGame(id, x, y, z, color, scene) {
    const newPlayer = new Player(id, x, y, z, color);
    players.push(newPlayer);
    scene.add(newPlayer.mesh);
    console.log(`Player ${id} ajouté au jeu :`, newPlayer);  // Debug
}

// Supprime tous les joueurs existants de la scène
export function removeAllPlayers(scene) {
    players.forEach(player => scene.remove(player.mesh));  // Supprime les joueurs de la scène
    players = [];  // Réinitialise le tableau de joueurs
}