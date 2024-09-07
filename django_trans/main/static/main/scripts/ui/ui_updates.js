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

function hideAllButtons() {
    let play_btns = document.getElementById('play_btns');
    if (play_btns) {
        play_btns.style.display = "none";
    }
}

function showAllButtons() {
    const buttons = document.querySelectorAll('.game-button');
    buttons.forEach(button => {
        button.classList.remove('hidden');
    });
}