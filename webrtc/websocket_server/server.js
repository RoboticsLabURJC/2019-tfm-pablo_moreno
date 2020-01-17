// npm install connect serve-static websocket
var http_web_server_port = 8080
var websocket_signaling_port = 1234

var connect = require('connect');
var WebSocketServer = require("websocket").server;
var HTTPStaticServer = require('serve-static');
var HTTPServer = require('http');

var webrtcClients = [];


connect().use(HTTPStaticServer(__dirname)).listen(http_web_server_port, function(){
  console.log("server listening (port "+http_web_server_port+")");
});

var signaling_http_server = HTTPServer.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
  console.log("signaling server listening (port "+websocket_signaling_port+")");
});

signaling_http_server.listen(websocket_signaling_port, function() { });

// create the server
wsServer = new WebSocketServer({ httpServer: signaling_http_server });

wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);
  ip = connection.remoteAddress.split(':');
  ip = ip[ip.length - 1];
  console.log("New connection (IP: " + ip + "): " + request.origin);

  connection.on('message', function(data) {
    var signal = JSON.parse(data.utf8Data);
    var exist = false;

    if (signal.type === "join" && signal.token !== undefined) {
      if (webrtcClients.some(e => e.token == signal.token)) {
        console.log("Token in use.");
        connection.send(
          JSON.stringify({
            type: "error_room",
            message: "Token in use, try again with other",
          })
        );

      } else {
        webrtcClients.push({
          token: signal.token,
          caller: connection,
          callee: "",
        })
        console.log("Join signal with token: " + signal.token);
      }

    } else if (signal.type === "check_room") {
      try {
        for (var i = 0; i < webrtcClients.length; i++) {
          if (webrtcClients[i].token === signal.token && webrtcClients[i].callee === "") {
            webrtcClients[i].callee = connection;

            webrtcClients[i].callee.send(
              JSON.stringify({
                type: "joinanswer",
                token: webrtcClients[i].token,
                callee: true,
              })
            );

            webrtcClients[i].caller.send(
              JSON.stringify({
                type: "joinanswer",
                token: webrtcClients[i].token,
                callee: false,
              })
            );

            console.log("Free caller found, redirecting callee with token: " + webrtcClients[i].token);
          }
        }
      } catch(e) {
        console.log(`error: ${e.toString()}`)
      }

    } else if (signal.type === "message") {
      for (var i = 0; i < webrtcClients.length; i++) {
        if (webrtcClients[i].token === signal.token) {
          if (webrtcClients[i].caller === connection) {
            console.log(`Message from caller, sending to callee. (Message: ${signal.message})`);
            webrtcClients[i].callee.send(
              JSON.stringify({
                type: "message",
                message: signal.message,
              })
            );
          } else {
            console.log(`Message from callee, sending to caller. (Message: ${signal.message})`);
            webrtcClients[i].caller.send(
              JSON.stringify({
                type: "message",
                token: signal.token,
                message: signal.message,
              })
            );
          }
        }
      }
    } else {
      console.log("Message: " + message.uft8Data);
    }
  });
});
