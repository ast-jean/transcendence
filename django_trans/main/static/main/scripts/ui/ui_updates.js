import { INITIAL_BALL_SPEED_X, INITIAL_BALL_SPEED_Y} from "../gameplay/ball.js"
import { setBallSpeedX, setBallSpeedY, tournament, modal } from "../utils/setter.js";
import { setGameOverState } from "../utils/setter.js"

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
    layer2Btns.classList.remove('visually-hidden');
}

export function hideLayer2Btns() {
    var layer2Btns = document.getElementById('layer2Btns');
    layer2Btns.classList.remove('active');
    layer2Btns.classList.add('visually-hidden');
}

export function hideBtn(btnName) {
    var btns = document.getElementById(btnName);
    btns.classList.remove('active');
    btns.classList.remove('d-flex');
    btns.classList.add('visually-hidden');
}


export function showBtn(btnName) {
    var btns = document.getElementById(btnName);
    btns.classList.add('active');
    btns.classList.add('d-flex');
    btns.classList.remove('visually-hidden');
}


export function hideAllButtons() {
    // const play_btns = document.querySelectorAll('.game-button');
    hideBtn('playerCount');
    hideBtn('joined');
    hideBtn('play_btns');
    // play_btns.forEach(button => {
    //     button.classList.add('visually-hidden');
    // });
}

export function showAllButtons() {
    const buttons = document.querySelectorAll('.game-button');
    buttons.forEach(button => {
        button.classList.remove('visually-hidden');
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
            setGameOverState(false);
            setBallSpeedX(INITIAL_BALL_SPEED_X);
            setBallSpeedY(INITIAL_BALL_SPEED_Y);
        } else {
            countdownContainer.textContent = countdown;
        }
    }, 1000);
}


export function updateTournamentUI(tournamentId, players) {
    //enable modal 
    //modal.show();
    //display players in slots
    // tournament.updatePlayerListUI(players);


    // const playerList = document.getElementById('playerListUl'); // Correction ici, on a playerList et playerListUl c'est pour ça qu'on avait un nul pensez à le renommer pareil ici et dans le html
    
    // if (!playerList) {
    //     console.error("Element 'playerListUl' non trouvé dans le DOM.");
    //     return; // Arrêtez l'exécution si l'élément n'existe pas
    // }
    
    // playerList.innerHTML = '';

    // players.forEach((player, index) => {
    //     let li = document.createElement('li');
    //     li.textContent = `Joueur ${index + 1}: ${player}`;
    //     playerList.appendChild(li);
    // });

    // console.log(`Mise à jour du tournoi ID ${tournamentId} avec les joueurs :`, players);
}

