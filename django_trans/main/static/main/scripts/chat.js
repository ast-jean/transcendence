import { socket } from './socket.js'

var input = document.getElementById('chat-input');

//Listening the button click
document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.getElementById('chat-btn');
    const chatInput = document.getElementById('chat-input');

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', function(event){
        if (event.key == 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });
});

//Receiving message from server
socket.addEventListener("message", (event) => {
    var li = document.createElement('li');
    li.textContent = event.id + ": " + event.message;
    // console.log('Message from server" ', event.data);
});


function sendMessage() {
    var message = input.value.trim();
    var name = "Me";
    if (message !== "") {
        console.log("sendMsg(): ",socket.readyState);
        var chatBox = document.getElementById('chat-messages');
        var li = document.createElement('li');
        li.textContent = name + ": " + message;
        socket.send(JSON.stringify({ message })); //Sending to gameserv/consumers.py 
        chatBox.appendChild(li);
        input.value = "";
        chatBox.scrollTop = chatBox.scrollHeight; 
    }
}
