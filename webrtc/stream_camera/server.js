const WebSocket = require('ws');
const ws_server = new WebSocket.Server({ port: 5000 });

console.log("server listening (port 5000)");

ws_server.on('connection', function(connection, req) {
  //var connection = request.accept(null, request.origin);

  ip = req.connection.remoteAddress.split(':');
  ip = ip[ip.length -1];

  console.log("new connection: (" + ip + ")")

  connection.on('message', function(message){
    var signal = JSON.parse(message);

    if (signal.type === "join" && signal.token !== undefined){
      console.log("token " + signal.token);
    }
  });

  connection.send('something');
});

//wss.close();
