
export function randomizeColors() {
    const randomColor = () => Math.floor(Math.random() * 16777215);

    changeColors({
        wallColor: randomColor(),
        player1Color: randomColor(),
        player2Color: randomColor(),
        ballColor: randomColor()
    });
}