import { getRoomId, socketState, getName, getAlias } from '../websockets/socket_pong.js'

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

    addChat("FYI","Click play Online to connect to the server",'black');
    addChat("FYI","Then use commands: /dm, /invite, /block, /profile",'black');

   if (sendButton !== null) {
       sendButton.addEventListener('click', () => {
           //console.log("Button is pressed");
           sendMessage();
       });
   } else {
       alert("NO SEND BUTTON, rip");
   }
   chatInput.addEventListener('keydown', (event) => {
       shouldPreventDefault = false;
       if (event.key == 'Enter') {
           //console.log("Enter pressed");
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

export function addChat(name, msg, textColor = 'black') {
    var chatBox = document.getElementById('chat-messages');
    var li = document.createElement('li');
    
    // Handle name fallback
    if (!name || name.trim().toLowerCase() === 'none') {
        name = 'Guest';
    }   
    // Set up the text content and styling
    li.classList.add("text-" + textColor);
    li.append(`${name} ${msg}`);
    
    // Prepend the image to the `li` element

    // Append the `li` to the chat box and auto-scroll
    chatBox.appendChild(li);
    li.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

export function addChatProfile(name, msg, textColor = 'black') {
    var chatBox = document.getElementById('chat-messages');
    var li = document.createElement('li');
    
    if (!name || name.trim().toLowerCase() === 'none') {
        name = 'Guest';
    }
    // Create anchor (hyperlink) element
    var link = document.createElement('a');
    var baseUrl = window.location.origin; // Dynamically fetch base URL
    link.href = baseUrl + msg;            // Concatenate base URL with the provided message (e.g., /profile/username)
    //console.log("BaseUrl = >"+baseUrl+"<");
    //console.log("Msg = >"+msg+"<");
    //console.log("link = >"+link.href+"<");

    link.textContent = msg;               // Display the msg as the link text
    link.style.color = 'blue';         // Apply the text color to the hyperlink

    // Append the name and the hyperlink to the list item
    li.textContent = "Link to profile ->" + " ";
    li.appendChild(link); // Append the hyperlink to the list item

    // Add the styled list item to the chat box
    chatBox.appendChild(li);
    li.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
   //console.log("in sendMessage()")
   var input = document.getElementById('chat-input');
   var msg = input.value.trim();
   var name = "Me";

    if (msg !== "") {
        //console.log("sendMsg(): ",socketState.socket.readyState);
        var chatBox = document.getElementById('chat-messages');
        var li = document.createElement('li');
        li.textContent = name + ": " + msg;
        chatBox.appendChild(li);
        input.value = "";
        chatBox.scrollTop = chatBox.scrollHeight; 

        var cmd = "chat"
        var roomId = getRoomId();
        var data = msg;
        var alias = getAlias();
        var name = getName();
        socketState.socket.send(JSON.stringify({ cmd, data, roomId, name, alias }));     
    }
}
