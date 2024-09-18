import { walls } from "../gameplay/wall.js";
import { players } from "../utils/setter.js";
import { sphere } from "../gameplay/ball.js";

function changeColors({ wallColor, player1Color, player2Color, ballColor }) {
    walls.forEach(wall => {
        wall.material.color.set(wallColor);
    });
 
    if (players[0]) {
        players[0].mesh.material.color.set(player1Color);
    }
 
    if (players[1]) {
        players[1].mesh.material.color.set(player2Color);
    }
 
    sphere.material.color.set(ballColor);
 }

export function randomizeColors() {
    const randomColor = () => Math.floor(Math.random() * 16777215);
    changeColors({
        wallColor: randomColor(),
        player1Color: randomColor(),
        player2Color: randomColor(),
        ballColor: randomColor()
    });
}
