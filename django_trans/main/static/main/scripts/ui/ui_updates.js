import { isGameOver } from "../pong.js";

export function updateTournamentInfo(roomId, playerCount, maxPlayers) {
    const tournamentRoomElement = document.getElementById('tournamentRoom');
    const connectedPlayersElement = document.getElementById('connectedPlayers');

    if (tournamentRoomElement && connectedPlayersElement) {
        tournamentRoomElement.innerHTML = `Tournament Room: ${roomId}`;
        connectedPlayersElement.innerHTML = `Players Connected: ${playerCount}/${maxPlayers}`;
    } else {
        console.error("Tournament info elements not found in DOM.");
    }
}

export function showLayer2Btns() {
    var layer2Btns = document.getElementById('layer2Btns');
    layer2Btns.classList.add('active');
    layer2Btns.classList.remove('hidden');
}

export function hideLayer2Btns() {
    var layer2Btns = document.getElementById('layer2Btns');
    layer2Btns.classList.remove('active');
    layer2Btns.classList.add('hidden');
}

export function hideAllButtons() {
    let play_btns = document.getElementById('play_btns');
    if (play_btns) {
        play_btns.style.display = "none";
    }
}

export function showAllButtons() {
    const buttons = document.querySelectorAll('.game-button');
    buttons.forEach(button => {
        button.classList.remove('hidden');
    });
}

export function startCountdown() {
    const countdownContainer = document.createElement('div');
    countdownContainer.id = 'countdown';
    countdownContainer.style.position = 'absolute';
    countdownContainer.style.top = '50%';
    countdownContainer.style.left = '50%';
    countdownContainer.style.transform = 'translate(-50%, -50%)';
    countdownContainer.style.fontSize = '3em';
    countdownContainer.style.color = '#fff';
    document.body.appendChild(countdownContainer);

    let countdown = 3;
    countdownContainer.textContent = countdown;

    const interval = setInterval(() => {
        countdown--;
        if (countdown === 0) {
            clearInterval(interval);
            document.body.removeChild(countdownContainer);
            isGameOver = false;
            ballSpeedX = INITIAL_BALL_SPEED_X;
            ballSpeedY = INITIAL_BALL_SPEED_Y;
        } else {
            countdownContainer.textContent = countdown;
        }
    }, 1000);
}


