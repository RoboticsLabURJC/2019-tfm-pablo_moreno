WSocket.onmessage = function(e) {
  var signal = JSON.parse(e.data);
  switch (signal.type) {
    case "chat":
      console.log("Message received.");
      add_message("receive", signal.message);
      break;
    case "candidate":
      console.log(`Candidate received (${signal.candidate}).`);
      onAddIceCandidate(signal.candidate)
      break;
    case "checkUser":
      if (signal.users) {
        console.log("Users ready to received stream.");
        startStream();
        document.getElementById("pstatus").innerHTML = "Users connected. Starting stream.";
      } else {
        console.log("Error: No user connected. Try again later...");
        document.getElementById("pstatus").innerHTML = "No user connected. Try again later...";
      }
      break;
    case "RTC-Offer":
      console.log("RTC-Offer received.");
      document.getElementById("pstatus").innerHTML = "Stream user connected. Starting stream.";
      startRemoteStream(signal.offer);
      break;
    case "RTC-Answer":
      console.log("RTC-Answer received.");
      setAnswer(signal.answer);
      break;
    default:
      console.log("Eror: Message not defined ->" + e.data);
  }
};


WSocket.onclose = function(e) {
  console.error('Chat socket closed unexpectedly');
};


function get_time() {
  var date = new Date();
  var hour = date.getHours();
  var minute = date.getMinutes();

  return hour + ":" + minute;
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


chatSend.focus();
chatSend.onkeyup = function(e) {
  if (e.keyCode == 13) {  // enter, return
    add_message("send", chatSend.value);

    WSocket.send(JSON.stringify({
      'type': "chat",
      'user': "sender",
      'text': chatSend.value
    }));

    chatSend.value = "";
    // Supress the newline character from chatSend when press enter for sending the message.
    return false;
  }
};
