
function sendMessage() {
    var input = document.getElementById('chat-input');
    var message = input.value.trim();
    if (message !== "") {
        var chatBox = document.getElementById('chat-messages');
        var li = document.createElement('li');
        li.textContent = message;
        chatBox.appendChild(li);
        input.value = "";
        chatBox.scrollTop = chatBox.scrollHeight; 
    }
}
