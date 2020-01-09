
const WebSocket = require('ws');
var exampleSocket = new WebSocket("ws://localhost:5000", "protocolOne");

exampleSocket.onopen = function (event) {
  exampleSocket.send("Here's some text that the server is urgently awaiting!");
};

exampleSocket.onmessage = function (event) {
  console.log("msg from server: %s", event.data);

  exampleSocket.close();
};