document.getElementById("channelSend").onkeydown = sendMessage;

var calle = false;
let localConnection;
let remoteConnection;
let sendChannel;
let receiveChannel;

const chatSend = document.getElementById('channelSend');
const wsClient = new WebSocket('ws://localhost:1234');

if (document.location.hash === "" || document.location.hash === undefined) {
  console.log("Checking for Calls");

  var token = Date.now()+"-"+Math.round(Math.random()*10000);
  var call_token = "#"+token;

  wsClient.onopen = function() {
    wsClient.send(
      JSON.stringify({
        token: call_token,
        type: "join",
      })
    );
    document.getElementById("loading_state").innerHTML = "Waiting for a call...ask your friend to visit:<br/><br/>"+document.location+call_token;
  }

  wsClient.onmessage = function(event) {
    var signal = JSON.parse(event.data);
    console.log("New message received.");

    if (signal.type === "joinanswer") {
      if (signal.callee === true) {
        console.log("Callee join: " + signal.token);
        document.location.hash = call_token;

        document.getElementById('dataChannelSend').disabled = true;

      } else {
        document.location.hash = signal.token;
      }
    } else if (signal.type === "message") {
      console.log("Message from callee received.");
      add_message("receive", signal.message);
    }  else if (signal.type === "error_room") {
      console.log(signal.message);
    }
  }
} else {
  call_token = document.location.hash;
  console.log("Entering in the room with token: " + call_token);

  wsClient.onopen = function () {
    wsClient.send(
      JSON.stringify({
        token: call_token,
        type: "check_room",
      })
    );
  }

  wsClient.onmessage = function(event) {
    var signal = JSON.parse(event.data);
    console.log("Caller message received: " + signal.token);

    if (signal.type === "joinanswer") {
      if (signal.callee === true) {
        console.log("Entering the room.");
        document.location.hash = signal.token;
      }
    }  else if (signal.type === "message") {
      console.log("Received message.");
      add_message("receive", signal.message);
    }
  }
}


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

  document.body.insertBefore(text_div, document.getElementById("h2"));
}


function sendMessage(e) {
  if (e.keyCode == 13) {
    add_message("send", chatSend.value);

    wsClient.send(
      JSON.stringify({
        type: "message",
        token: call_token,
        message: chatSend.value,
      })
    );
    chatSend.value = "";
    // Supress the newline character from chatSend when press enter for sending the message.
    return false;
  }
}
