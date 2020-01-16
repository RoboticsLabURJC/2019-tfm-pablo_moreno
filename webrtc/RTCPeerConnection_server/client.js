
connectButton.addEventListener('click', start);

var calle = false;

function start() {
  localVideo = document.getElementById('streamVideo');
  remoteVideo = document.getElementById('showVideo');

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

        } else {
          document.location.hash = signal.token;
          location.reload();

          console.log("Hello");
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
  }
}
