'use strict';

// create the unique token for this call
var token = Date.now()+"-"+Math.round(Math.random()*10000);
document.location.hash = "#"+token;

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

startButton.addEventListener('click', start);


async function start() {
  console.log('Requesting local stream');

  leftVideo.play();
  startButton.disabled = true;

  try {
    if (leftVideo.captureStream) {
      stream = await leftVideo.captureStream();
    } else if (leftVideo.mozCaptureStream) {
      stream = await leftVideo.mozCaptureStream();
    }
  } catch (e) {
    console.log(`getUserMedia() error: ${e.name}`);
  }

  /* Stream camera video&audio */
  //const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
  //leftVideo.srcObject = stream;
  //
  localStream = stream;

  var configuration = {
    "iceServers": [{ "urls": "stun:stun.1.google.com:19302" }]
  };
  pc1 = new RTCPeerConnection(configuration);
  pc2 = new RTCPeerConnection(configuration);
  console.log("Created RTCPeerConnections");

  pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
  pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
  console.log("Added candidates handlers created.")

  pc2.ontrack = gotRemoteStream;
  console.log("Received stream handler created");

  pc2.oniceconnectionstatechange = () => console.log('PC2 ice state ' + pc2.iceConnectionState);

  console.log("localStream: " + localStream);

  console.log(`Streamed tracks added ${localStream.getTracks()[0].label}`);
  localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));

  try{
    const offer = await pc1.createOffer(offerOptions);
    //console.log(`Offer from pc1\n${offer.sdp}`);
    //console.log("Pc1 offer created.");
    try {
      await pc1.setLocalDescription(offer);
      console.log("Pc1 description created.")
    } catch(error) {
      console.log(`Failed to set session description: ${error.toString()}`);
    }
    setPc2Connection(offer);
  } catch(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }
}


async function setPc2Connection(desc) {
  try {
    await pc2.setRemoteDescription(desc);
    //console.log(`Description set\n${desc.sdp}`);
    console.log("Pc2 description set.");
  } catch (error) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }

  try {
    const answer = await pc2.createAnswer();

    try {
      await pc2.setLocalDescription(answer);
      //console.log(`Pc2 description created\n${answer.sdp}`)
      console.log("Pc2 description created.");
    } catch (error) {
      console.log(`Failed to set session description: ${error.toString()}`);
    }

    try {
      await pc1.setRemoteDescription(answer);
      console.log("Session Pc1 complete.")
    } catch (error) {
      console.log(`Failed to set session description: ${error.toString()}`);
    }
  } catch (error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }
}


function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}


function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}


async function onIceCandidate(pc, e) {
  // Save a list of ice candidates to send to the peer
  try{
    if (e.candidate !== null) {
      console.log(`${getName(pc)} new ${event.candidate.candidate}`);
      await getOtherPc(pc).addIceCandidate(e.candidate);

      iceCandidates.push(e.candidate);
    }

    var strList = "";
    iceCandidates.forEach(function(element) {
      strList = strList + element.candidate + '\n';
    });

    console.log('Candidates list:\n' + strList);
  } catch (error) {
    console.log(`${pc} failed to add ICE Candidate: ${error.toString()}`);
  }
}


function gotRemoteStream(e) {
  console.log(e.streams[0]);
  if (rightVideo.srcObject !== e.streams[0]) {
    rightVideo.srcObject = e.streams[0];
    console.log('pc2 received remote stream');
  }
}
