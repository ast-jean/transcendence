import { getRoomId, socketState } from '../websockets/socket_pong.js'

export let shouldPreventDefault = true;

export function getShouldPreventDefault(){
   return shouldPreventDefault;
}

export function setShouldPreventDefault(boolean){
   shouldPreventDefault = boolean;
}

export function showChat() {
    var chatContainer = document.getElementById('chat-container');
    chatContainer.style.display = 'block'; // or 'flex', depending on your layout
}

export function hideChat() {
    var chatContainer = document.getElementById('chat-container');
    chatContainer.style.display = 'none';
}

function pageLoaded() {
    //    alert("PAge loaded");
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
   }, true);
   chatInput.addEventListener('keyup', function(event){
       shouldPreventDefault = true;
   }, true);
}

//Listening the button click
document.addEventListener('DOMContentLoaded', pageLoaded);

export function addChat(name, msg) {
    var chatBox = document.getElementById('chat-messages');
    var li = document.createElement('li');
    
    console.log("In addChat() => " + name);
    if (!name || name.trim().toLowerCase() === 'none') {
        name = 'Guest';
    }
    li.textContent = name +" " + msg;
    chatBox.appendChild(li);
}

export function parsingChat(name, msg) {

}

// //Receiving message from server
// export function receiveConnect(client_id){
//    var chatBox = document.getElementById('chat-messages');
//    var li = document.createElement('li');

//    li.textContent = client_id + " has joined.";
//    chatBox.appendChild(li);
// }

// export function receiveDisconnect(client_id){
//    var chatBox = document.getElementById('chat-messages');
//    var li = document.createElement('li');
//    li.textContent = client_id + " left the game.";
//    chatBox.appendChild(li);
// }

// //Receiving message from server
// export function receiveChat(client_id, client_msg){
//    var chatBox = document.getElementById('chat-messages');
//    var li = document.createElement('li');
//    li.textContent = client_id + ": " + client_msg;
//    chatBox.appendChild(li);
// }

function sendMessage() {
   console.log("in sendMessage()")
   var input = document.getElementById('chat-input');
   var msg = input.value.trim();
   var name = "Me";

    if (msg !== "") {
        console.log("sendMsg(): ",socketState.socket.readyState);
        var chatBox = document.getElementById('chat-messages');
        var li = document.createElement('li');
        li.textContent = name + ": " + msg;
        chatBox.appendChild(li);
        input.value = "";
        chatBox.scrollTop = chatBox.scrollHeight; 

        var cmd = "chat"
        var roomId = getRoomId();
        var data = msg;
        var name = document.getElementById('name');
        socketState.socket.send(JSON.stringify({ cmd, data, roomId, name }));     
    }
}
