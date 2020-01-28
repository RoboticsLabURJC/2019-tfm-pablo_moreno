document.getElementById("channelSend").onkeydown = sendMessage;

var calle = false;
let localConnection;
let remoteConnection;
let sendChannel;
let receiveChannel;

const chatSend = document.getElementById('channelSend');
const wsClient = new WebSocket('ws://localhost:1234');

//Get & show the stream.
const leftVideo = document.getElementById('streamVideo');
const rightVideo = document.getElementById('showVideo');

let stream
let localStream;
let pc1;
let pc2;

const iceCandidates = [];
const offerOptions = {
  OfferToReceiveAudio: 1,
  OfferToReceiveVideo: 1
};

const constraints = {
  video: {
    //mediaSource: "screen", // whole screen sharing
     mediaSource: "window", // choose a window to share
    // mediaSource: "application", // choose a window to share
    width: {max: '1920'},
    height: {max: '1080'},
    frameRate: {max: '10'}
  }
};

var configuration = {
  "iceServers": [{ "urls": "stun:stun.1.google.com:19302" }]
};

startButton.addEventListener('click', startStream);

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
      if (signal.callee === false) {
        console.log("Callee join: " + signal.token);
        document.location.hash = call_token;
        document.getElementById("loading_state").outerHTML = '';
      }
    } else if (signal.type === "message") {
      console.log("Message from callee received.");
      add_message("receive", signal.message);
    } else if (signal.type === "error_room") {
      console.log(signal.message);
    } else if (signal.type === "stream") {
      console.log(signal.pc);
      pc2 = new RTCPeerConnection(configuration);
      console.log("Created RTCPeerConnections");
      pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
      console.log("Added candidates handlers created.");

      pc2.ontrack = gotRemoteStream;
      console.log("Received stream handler created");

      pc2.oniceconnectionstatechange = () => console.log('PC2 ice state ' + pc2.iceConnectionState);

      setPc2Connection(signal.offer);
    } else if (signal.type === "stream-set") {
      try {
        setPc1Description(signal.answer);
        console.log("Session Pc1 complete.");
      } catch (error) {
        console.log(`Failed to set session description: ${error.toString()}`);
      }
    } else if (signal.type === "candidate") {
      if (pc1 === undefined) {
        console.log("Adding new candidate to pc2.");
        console.log(signal.candidate);
        console.log("ADDING")
        pc2.addIceCandidate(signal.candidate);
      } else {
        console.log("Adding new candidate to pc1.");
        console.log(signal.candidate);
        console.log("ADDING")
        pc1.addIceCandidate(signal.candidate);
      }

      iceCandidates.push(signal.candidate);
      var strList = "";
      iceCandidates.forEach(function(element) {
        strList = strList + element.candidate + '\n';
      });
      console.log('Candidates list:\n' + strList);
    }
  }
} else {
  document.getElementById("loading_state").outerHTML = '';
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
    console.log("Caller message received.");

    if (signal.type === "joinanswer") {
      if (signal.callee === true) {
        console.log("Entering the room.");
        document.location.hash = signal.token;
      }
    } else if (signal.type === "error_room") {
      document.getElementById("loading_state").innerHTML = "Error: " + signal.message;
    } else if (signal.type === "message") {
      console.log("Received message.");
      add_message("receive", signal.message);
    } else if (signal.type === "stream") {
      pc2 = new RTCPeerConnection(configuration);
      console.log("Created RTCPeerConnections");
      pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
      console.log("Added candidates handlers created.");

      pc2.ontrack = gotRemoteStream;
      console.log("Received stream handler created");

      pc2.oniceconnectionstatechange = () => console.log('PC2 ice state ' + pc2.iceConnectionState);

      setPc2Connection(signal.offer);
    } else if (signal.type === "stream-set") {
      try {
        setPc1Description(signal.answer);
        console.log("Session Pc1 complete.");
      } catch (error) {
        console.log(`Failed to set session description: ${error.toString()}`);
      }
    } else if (signal.type === "candidate") {
      if (pc1 === undefined) {
        console.log("Adding new candidate to pc2.");
        console.log(signal.candidate);
        console.log("ADDING")
        pc2.addIceCandidate(signal.candidate);
      } else {
        console.log("Adding new candidate to pc1.");
        console.log(signal.candidate);
        console.log("ADDING")
        pc1.addIceCandidate(signal.candidate);
      }


      iceCandidates.push(signal.candidate);
      var strList = "";
      iceCandidates.forEach(function(element) {
        strList = strList + element.candidate + '\n';
      });
      console.log('Candidates list:\n' + strList);
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

  document.querySelector("#messages").appendChild(text_div);
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


async function startStream() {
  console.log("Starting stream");
  leftVideo.play();
  startButton.disabled = true;

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  leftVideo.srcObject = stream;

  localStream = stream;

  pc1 = new RTCPeerConnection(configuration);
  pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
  console.log("Added candidates handlers created.");

  console.log(`Streamed tracks added ${localStream.getTracks()[0].label}`);
  localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));

  try{
    const offer = await pc1.createOffer(offerOptions);

    try {
      await pc1.setLocalDescription(offer);
      console.log("Pc1 description created.");
    } catch(error) {
      console.log(`Failed to set session description: ${error.toString()}`);
    }
    console.log(pc1);
    wsClient.send(
      JSON.stringify({
        type: "stream",
        token: call_token,
        offer: offer,
      })
    );
  } catch(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }
}


function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}


async function onIceCandidate(pc, event) {
  // Save a list of ice candidates to send to the peer
  console.log("Sending candidate.");
  if (event.candidate != null || event.candidate != undefined) {
    wsClient.send(
      JSON.stringify({
        type: "candidate",
        token: call_token,
        candidate: event.candidate,
      })
    );
  }
}


async function setPc2Connection(offer) {
  try {
    await pc2.setRemoteDescription(offer);
    console.log("Pc2 description set.");
  } catch (error) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }

  try {
    const answer = await pc2.createAnswer();

    try {
      await pc2.setLocalDescription(answer);
      console.log("Pc2 description created.");

      wsClient.send(
        JSON.stringify({
          type: "stream-set",
          token: call_token,
          answer: answer,
        })
      );
    } catch (error) {
      console.log(`Failed to set session description: ${error.toString()}`);
    }
  } catch (error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }
}


async function setPc1Description(answer) {
  try {
    await pc1.setRemoteDescription(answer);
    console.log("Session Pc1 complete.")
  } catch (error) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }
}


function gotRemoteStream(e) {
  console.log(e.streams[0]);
  if (rightVideo.srcObject !== e.streams[0]) {
    //rightVideo.play();
    rightVideo.srcObject = e.streams[0];
    console.log('pc2 received remote stream');
  }
}
