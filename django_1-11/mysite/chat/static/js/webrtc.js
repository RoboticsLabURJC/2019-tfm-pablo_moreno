startButton.addEventListener('click', checkUsers);

function checkUsers() {
  WSocket.send(
    JSON.stringify({
      type: "checkUser",
    })
  );
}

async function startStream() {
  if (checkUsers) {
    pc1 = new RTCPeerConnection(configuration);

    console.log("Starting stream");
    leftVideo.play();
    startButton.disabled = true;

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    leftVideo.srcObject = stream;

    localStream = stream;

    pc1.addEventListener('icecandidate', e => onIceCandidate(e));
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
      console.log("Sending pc1 offer.");
      WSocket.send(
        JSON.stringify({
          type: "RTC-Offer",
          offer: offer,
        })
      );
    } catch(error) {
      console.log(`Failed to create session description: ${error.toString()}`);
    }
  }
}


async function startRemoteStream(offer) {
  pc2 = new RTCPeerConnection(configuration);
  console.log("Created PC2 RTCPeerConnections");
  pc2.addEventListener('icecandidate', e => onIceCandidate(e));
  console.log("Added candidates handlers created.");

  pc2.ontrack = gotRemoteStream;
  console.log("Received stream handler created");

  pc2.oniceconnectionstatechange = () => console.log('PC2 ice state ' + pc2.iceConnectionState);

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
      console.log("Pc2 session complete.");
      console.log("Sending Pc2 answer.");
      WSocket.send(
        JSON.stringify({
          type: "RTC-Answer",
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


async function setAnswer(answer) {
  try {
    await pc1.setRemoteDescription(answer);
    console.log(" Pc1 Session complete.")
  } catch (error) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }
}


function onAddIceCandidate(cand) {
  var candidate = new RTCIceCandidate(cand)
  if (pc1 === undefined) {
    pc2.addIceCandidate(candidate);
  } else {
    pc1.addIceCandidate(candidate);
  }
}


async function onIceCandidate(event) {
  if (event.candidate != null || event.candidate != undefined) {
    WSocket.send(
      JSON.stringify({
        type: "candidate",
        candidate: event.candidate,
      })
    );
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
