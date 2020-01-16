// npm install connect serve-static websocket
var http_web_server_port = 8080
var websocket_signaling_port = 1234

var connect = require('connect');
var WebSocketServer = require("websocket").server;
var HTTPStaticServer = require('serve-static');
var HTTPServer = require('http');

var webrtcClients = {};
var webrtcDiscussions = {};


connect().use(HTTPStaticServer(__dirname)).listen(http_web_server_port, function(){ });

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

  connection.on('message', function(message) {
    var signal = JSON.parse(message.utf8Data);
    var free_caller = false;

    if (signal.type === "join" && signal.token !== undefined) {
      if (Object.keys(webrtcClients).length === 0) {
        webrtcDiscussions[signal.token] = {};
        webrtcDiscussions[signal.token][connection] = false;
        webrtcClients[signal.token] = connection;
        console.log("Join signal with token: " + signal.token);
      } else {
        token = Object.keys(webrtcClients)[0]
        connection.send(
          JSON.stringify({
            type: "joinanswer",
            token: token,
            callee: false,
          })
        );

        webrtcClients[token].send(
          JSON.stringify({
            type: "joinanswer",
            token: token,
            callee: true,
          })
        );

        delete webrtcDiscussions[token];
        delete webrtcClients[token];

        console.log("Free caller found, redirecting callee with token: " + token);
      }
    } else if (signal.type === "check_room") {
      try {
        //console.log(webrtcDiscussions[signal.token])
        token = Object.keys(webrtcClients)[0]
        connection.send(
          JSON.stringify({
            type: "joinanswer",
            token: token,
            callee: false,
          })
        );

        webrtcClients[token].send(
          JSON.stringify({
            type: "joinanswer",
            token: token,
            callee: true,
          })
        );

        delete webrtcDiscussions[token];
        delete webrtcClients[token];

        console.log("Free caller found, redirecting callee with token: " + token);
      } catch(e) {
        console.log(`error: ${e.toString()}`)
      }
    } else {
      console.log("Message: " + message.uft8Data);
    }
  });
});
