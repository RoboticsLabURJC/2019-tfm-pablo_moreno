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
    var answer;
    var room_found = false;

    req_str = `New message.\n  Signal: ${signal.type}\n  Token: ${signal.token}`;
    switch (signal.type) {
      case "join":
        if (signal.token != undefined) {
          if (webrtcClients.some(e => e.token == signal.token)) {
            req_str += "\n  Answer:\n    Type: 'error_room'\n    Message: Token in use.";
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
            req_str += "\n  Answer: Create the room.";
            //console.log("Join signal with token: " + signal.token);
          }
        }
        break;
      case "check_room":
        try {
          for (var i = 0; i < webrtcClients.length; i++) {
            if (webrtcClients[i].token === signal.token && webrtcClients[i].callee === "") {
              room_found = true;
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
              req_str += `\n  Answer:\n    Type: ${signal.type}\n    Token: ${signal.token}\n    Message: Join the room.`;
            }
          }
          if (!room_found) {
            req_str += "\n  Answer:\n    Type: 'error_room'\n    Message: Token in use.";
            connection.send(
              JSON.stringify({
                type: "error_room",
                message: "Token in use, try again with other",
              })
            );
          }
        } catch(e) {
          console.log(`error: ${e.toString()}`)
        }
        break;
      case "message":
        answer = JSON.stringify({
          type: "message",
          message: signal.message,
        })
        break;
      case "stream":
      answer = JSON.stringify({
        type: "stream",
        offer: signal.offer,
        })
        break;
      case "stream-set":
        answer = JSON.stringify({
          type: "stream-set",
          answer: signal.answer,
        })
        break;
      case "candidate":
        answer = JSON.stringify({
          type: "candidate",
          candidate: signal.candidate,
        })
        break;
      default:
        console.log("Message: " + message.uft8Data);
    }
    if (signal.type === "message" || signal.type === "stream" || signal.type === "stream-set" || signal.type === "candidate") {
      req_str += `\n  Answer:\n    type:${JSON.parse(answer).type}`
      for (var i = 0; i < webrtcClients.length; i++) {
        if (webrtcClients[i].token === signal.token) {
          if (webrtcClients[i].caller === connection) {
            webrtcClients[i].callee.send(answer);
          } else {
            webrtcClients[i].caller.send(answer);
          }
        }
      }
    }
    console.log(req_str);
  });
});
