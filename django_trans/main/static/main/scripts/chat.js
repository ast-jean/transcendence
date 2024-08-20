import { socketState } from './socket_pong.js'

export let shouldPreventDefault = true;


export function getShouldPreventDefault(){
    return shouldPreventDefault;
}

export function setShouldPreventDefault(boolean){
    shouldPreventDefault = boolean;
}


function pageLoaded() {
    alert("PAge loaded");
    const sendButton = document.getElementById('chat-btn');
    const chatInput = document.getElementById('chat-input');
    if (sendButton !== null) {
        sendButton.addEventListener('click', () => {
            console.log("Button is pressed");
            sendMessage();
        });
    } else {
        alert("NO SEND BUTTON, rip");
    }
    chatInput.addEventListener('keydown', (event) => {
        shouldPreventDefault = false;
        if (event.key == 'Enter') {
            console.log("Enter pressed");
            // event.preventDefault();
            sendMessage();
        }
        else {
            console.log("another key is pressed");
        }
    }, true);
    chatInput.addEventListener('keyup', function(event){
        shouldPreventDefault = true;
    }, true);
}

//Listening the button click
document.addEventListener('DOMContentLoaded', pageLoaded);

//Receiving message from server
export function receiveConnect(client_id){
    var chatBox = document.getElementById('chat-messages');
    var li = document.createElement('li');

    li.textContent = client_id + " has joined.";
    chatBox.appendChild(li);
}

export function receiveDisconnect(client_id){
    var chatBox = document.getElementById('chat-messages');
    var li = document.createElement('li');
    li.textContent = client_id + " left the game.";
    chatBox.appendChild(li);
}

//Receiving message from server
export function receiveChat(client_id, client_msg){
    var chatBox = document.getElementById('chat-messages');
    var li = document.createElement('li');
    li.textContent = client_id + ": " + client_msg;
    chatBox.appendChild(li);
}

function sendMessage() {
    console.log("in sendMessage()")
    var data = input.value.trim();
    var input = document.getElementById('chat-input');
    var name = "Me";

    if (data !== "") {
        console.log("sendMsg(): ",socket.readyState);
        var chatBox = document.getElementById('chat-messages');
        var li = document.createElement('li');
        li.textContent = name + ": " + data;
        chatBox.appendChild(li);
        input.value = "";
        chatBox.scrollTop = chatBox.scrollHeight; 

        var cmd = "chat"
        socketState.socket.send(JSON.stringify({ cmd, data }));     
    }
}
