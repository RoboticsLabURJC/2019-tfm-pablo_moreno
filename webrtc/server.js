const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 5000 });

wss.on('connection', function connection(ws, req) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    console.log('ip: %s', req.connection.remoteAddress.substr(7));
  });

  ws.send('something');
});

//wss.close();