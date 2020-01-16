
connectButton.addEventListener('click', start);

var calle = false;
let localConnection;
let remoteConnection;
let sendChannel;
let receiveChannel;

const dataChannelSend = document.getElementById('dataChannelSend');
const dataChannelReceive = document.getElementById('dataChannelReceive');
const servers = null;

function start() {
  var wsClient = new WebSocket('ws://localhost:1234');

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
      console.log("Calle token received: " + signal.token);

      if (signal.type === "joinanswer") {
        if (signal.callee === true) {
          document.location.hash = call_token;

          document.getElementById('dataChannelSend').disabled = true;

          createLocalConnection();
        } else {
          document.location.hash = signal.token;
          location.reload();
        }
      }
    }
  } else {
    token = document.location.hash;
    console.log("Entering in the room with token: " + token);

    //var wsClient = new WebSocket('ws://localhost:1234');
    wsClient.onopen = function () {
      wsClient.send(
        JSON.stringify({
          token: token,
          type: "check_room",
        })
      );
    }

    wsClient.onmessage = function(event) {
      var signal = JSON.parse(event.data);
      console.log("Calle token received: " + signal.token);

      if (signal.type === "joinanswer") {
        if (signal.callee === true) {
          document.location.hash = call_token;

        } else {
          document.location.hash = signal.token;
          location.reload();

          createRemoteConnection();
        }
      }
    }
  }
}


function createLocalConnection() {
  localConnection = new RTCPeerConnection(servers);
  sendChannel = localConnection.createDataChannel('sendDataChannel')
  console.log("localDataChannel created.");

  localConnection.onicecandidate = e => {
    onIceCandidate(localConnection, e)
  };

  sendChannel.onopen = onSendChannelStateChange;
  sendChannel.onclose = onSendChannelStateChange;

  localConnection.createOffer().then(
    setDescription1,
    onCreateSessionDescriptionError
  );
}


function setDescription1(desc) {
  localConnection.setLocalDescription(desc);
  remoteConnection.setRemoteDescription(desc);
  remoteConnection.createAnswer().then(
    setDescription2,
    onCreateSessionDescriptionError
  );
}


function seteDescription2(desc) {
  remoteConnection.setLocalDescription(desc);
  localConnection.setRemoteDescription(desc);
}


function onCreateSessionDescriptionError(error) {
  console.log('Failed to create session description: ' + error.toString());
}


function createRemoteConnection() {
  remoteConnection = new RTCPeerConnection(servers);
  receiveChannel = remoteConnection.createDataChannel('receiveDataChannel');
  console.log("remoteDataChannel created.");

  remoteConnection.onicecandidate = e => {
    onIceCandidate(remoteConnection, e);
  };

  remoteConnection.ondatachannel = receiveChannelCallback;
}


function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}



function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}


function onIceCandidate(pc, event) {
  try{
    getOtherPc(pc).addIceCandidate(event.candidate);
    console.log(`${getName(pc)} new ${event.candidate.candidate}`);
  } catch (error) {
    console.log(`${pc} failed to add ICE Candidate: ${error.toString()}`);
  }
}


function receiveChannelCallback(event) {
  receiveChannel = event.channel;
  receiveChannel.onmessage = function(e) {
    dataChannelReceive.value = e.data;
  }
  receiveChannel.onopen = function() {
    console.log(`Open channel state is ${receiveChannel.readyState}`);
  }
  receiveChannel.onclose = function() {
    console.log(`Receive channel state is ${receiveChannel.readyState}`)
  }
}


function onSendChannelStateChange() {
  const readyState = sendChannel.readyState;
  if (readyState === 'open') {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
  } else {
    dataChannelSend.disabled = true;
  }
}
