console.log("HOLA");

var this_js_script = $('script[src*=main.js]');

var roomName = this_js_script.attr('roomName');
const chatSend = document.getElementById('channelSend');

console.log(`roomName: ${roomName}`);

var chatSocket = new WebSocket(
  'ws://' + window.location.host +
  '/ws/chat/' + roomName + '/');


chatSocket.onmessage = function(e) {
  var data = JSON.parse(e.data);
  var message = data['message'];
  add_message("receive", message);
};


chatSocket.onclose = function(e) {
  console.error('Chat socket closed unexpectedly');
};

function get_time() {
  var date = new Date();
  var hour = date.getHours();
  var minute = date.getMinutes();

  var time = hour + ":" + minute;

  return time;
}

function add_message (type, message) {
  var text_div = document.createElement("div");
  var p = document.createElement("p");
  var time = document.createElement("span");

  if (type === "send") {
    text_div.className = "container";
    time.className = "time-right";
  } else {
    text_div.className = "container darker";
    time.className = "time-left";
  }

  p.innerHTML = message;
  text_div.appendChild(p);

  time.innerHTML = get_time();
  text_div.appendChild(time);

  document.querySelector("#messages").appendChild(text_div);
}


chatSend.focus();
chatSend.onkeyup = function(e) {
  if (e.keyCode == 13) {  // enter, return
    add_message("send", chatSend.value);

    chatSocket.send(JSON.stringify({
      'message': chatSend.value
    }));

    chatSend.value = "";
    // Supress the newline character from chatSend when press enter for sending the message.
    return false;
  }
};
