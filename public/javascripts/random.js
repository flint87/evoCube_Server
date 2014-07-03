
var socket;
var initState = 0;
setInterval(function() {
	socket.emit("inCharge", function(message) {
		//writeLog("Main client: " + message);				
		if (message) {
			$("#feedback").html("Du bist jetzt mit dem Fernseher verbunden und kannst dir beliebige Trailer anschauen.");
		} else {
			if (initState == "noRemoteConnection") {
				$("#feedback").html("Du bist momentan nicht mit dem Fernseher verbunden. Tippe hier um eine Verbindung herzustellen.");
			}
		}
	});

}, 2000);

function connect() {

var myCodeTimer;

	socket = io("192.168.0.29:3000", {"reconnect": false});
	//socket = io("http://178.77.68.72:3000", {"reconnect": false});

	//hide the movie control items at startup
	//$("#movieControls").hide(1);

	socket.on("connect", function() {
		//$("#status").html("Verbindung hergestellt");
		$("#status").hide("slow");
		registerToServer();
		writeLog("connected");
	});
	socket.on("disconnect", function() {
		$("#status").html("Serverfehler");
		$("#status").show("slow");
		//$("#status").html("Disconnected from Server");
		writeLog("Disconnect detected");
		$("#movieControls").hide("slow");
		$("#initElements").show("slow");
		initState = "noRemoteConnection";
	});
	socket.on("reconnecting", function(nextRetry) {
		$("#status").html("Internetverbindung unterbrochen");
		$("#status").show("slow");
		//$("#status").html("Reconnecting in " + nextRetry + " milliseconds");
		writeLog("Reconnect detected");
		$("#movieControls").hide("slow");
		$("#initElements").show("slow");
		initState = "noRemoteConnection";
	});

	//you are not remote client anymore
	socket.on("byebyeRemote", function() {
		$("#feedback").html("Du bist momentan nicht mit dem Fernseher verbunden. Tippe hier um eine Verbindung herzustellen.");
		$("#initElements").show("slow");
		$("#movieControls").hide("slow");
	});

	socket.on("reconnect_failed", function() {
		$("#status").html("Reconnect failed"); 
	});

	$("#volume").bind("change", function(event, ui) {
		writeLog($("#volume").val());
		socket.emit("remoteVolumeChange", $("#volume").val()*2);
	});

	socket.on("sendPlayList", function(newPlaylist) {
		writeLog("Playlist successfully received from Server");
		$("#movieList").empty();
		for (var i = 0; i < newPlaylist.length; i++) {
			$('#movieList').append('<li id= \'' + newPlaylist[i].interalName + '\'><a>' + newPlaylist[i].movieName + '</a></li>').listview('refresh');
		}
		$('#movieList').on('click', 'li', function() {
			writeLog($(this).attr("id"));
			socket.emit("playSpecifTrailer", $(this).attr("id"), function(message) {
				writeLog("Feedback: " + message);
			});
		});
	});

}


//notify the server that remote client wants to take control of the video client's monitor
function giveMeControl() {
	socket.emit("giveMeControl", function(answer) {
		//only allow a connection if no trailer is running at the moment
		if (answer) {
			$("#feedback").html("Zurzeit läuft gerade ein Trailer auf dem Fernseher. ");
		} else {
			$("#feedback").html("Gib die Nummer ein, die du am Fenseher siehst und tippe auf Bestätigen");
			$("#initElements").hide("slow");
			$("#codeElements").show("slow");
			initState = "waitingForCode";
			//after 20 seconds reset the state
			myCodeTimer = setTimeout(function() {
				$("#feedback").html("Du bist momentan nicht mit dem Fernseher verbunden. Tippe hier um eine Verbindung herzustellen.");
				$("#initElements").show("slow");
				$("#codeElements").hide("slow");
			}, 20000);
		}
	});
}

//check with the server if the code is correct. if yes grant access to monitor
function submitCode() {
	writeLog("Secret Value: " + $("#secret").val());
	socket.emit("checkMyCode", $("#secret").val(), function(answer) {
		if (answer) {
			$("#feedback").html("Du bist jetzt mit dem Fernseher verbunden und kannst dir beliebige Trailer anschauen.");
			$("#codeElements").hide("slow");
			$("#movieControls").show("slow");
			initState = "established";
			$("#secret").val("");
			clearTimeout(myCodeTimer);
		} else {
			//Code was false. Start the timeout mechanism
			$("#feedback").html("Der Code war leider nicht richtig. Probiere es noch einmal.");
		}

	});
}


//try to stop the video
function stopVideo() {
	writeLog("Stop pressed");
	socket.emit("remoteStop");
}


function disconnect() {
	writeLog("disconnect");
	socket.disconnect();
}


//try to start pause the video
function start() {
	writeLog("Play/Pause pressed");
	socket.emit("remote_playPause");
}

//notify server that this is a new remote client
function registerToServer() {
	socket.emit("clientRegister", function() {
		writeLog("Client successfully registered to Server");
	});
}

//logging with timestap
function writeLog(message) {
	console.log(new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " " + message);
}