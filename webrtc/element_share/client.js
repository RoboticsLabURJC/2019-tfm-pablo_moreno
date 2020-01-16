'use strict';

// create the unique token for this call
var token = Date.now()+"-"+Math.round(Math.random()*10000);
var call_token = "#"+token;

var Wss2Server = new WebSocket('ws://localhost:5000');

document.location.hash = call_token;

Wss2Server.onopen = function() {
  // tell the signaling server you have joined the call
  console.log("sending 'join' signal for call token:"+call_token);
  Wss2Server.send(
    JSON.stringify({
      token:call_token,
      type:"join",
    })
  );
}

// setup caller signal handler
Wss2Server.onmessage = function(event) {
  console.log(`[message] Data received from server: ${event.data}`);
};

Wss2Server.onclose = function(event) {
  if (event.wasClean) {
    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    // e.g. server process killed or network down
    // event.code is usually 1006 in this case
    alert('[close] Connection died');
  }
};

Wss2Server.onerror = function(error) {
  console.log(`[error] ${error.message}`);
};

//Get & show the stream.
const leftVideo = document.getElementById('streamVideo');
const rightVideo = document.getElementById('showVideo');

console.log("element: " + document.querySelector('container'));

console.log("Start Streaming");
leftVideo.addEventListener('canplay', () => {
  let stream;
  const fps = 0;
  if (leftVideo.captureStream) {
    stream = leftVideo.captureStream(fps);
  } else if (leftVideo.mozCaptureStream) {
    stream = leftVideo.mozCaptureStream(fps);
  } else {
    console.error('Stream capture is not supported');
    stream = null;
  }
  rightVideo.srcObject = stream;
});
