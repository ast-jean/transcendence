import { socketState } from './socket_pong.js'
import { shouldPreventDefault } from './pong.js'


//Listening the button click
document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.getElementById('chat-btn');
    const chatInput = document.getElementById('chat-input');

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', function(event){
    shouldPreventDefault = false;
        if (event.key == 'Enter') {
            event.preventDefault();
            sendMessage();
        }
        else {
            event.
            console.log("another key is pressed");
        }
    });
    chatInput.addEventListener('keyup', function(event){
        shouldPreventDefault = true;
    });
});

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
