var socket;

setInterval(function() { 
	socket.emit("inCharge", function(message){
				writeLog("Main client: " + message);
				console.dir(socket);
			});

}, 2000);

function connect() {


	//socket = io("192.168.0.29:3000", {"reconnect": false});
	socket = io("http://178.77.68.72:3000", {"reconnect": false});


	socket.on("connect", function() {
		$("#status").html("Connected to Server. My ID is: " + socket);
		console.dir(socket);
		registerToServer();
		writeLog("connected");
	});
	socket.on("disconnect", function() {
		$("#status").html("Disconnected from Server");
		writeLog("Disconnect detected");
	});
	socket.on("reconnecting", function(nextRetry) {
		$("#status").html("Reconnecting in " + nextRetry + " milliseconds");
		writeLog("Reconnect detected");
	});
	socket.on("reconnect_failed", function() {
		$("#status").html("Reconnect failed");
	});

	$("#volume").bind("change", function(event, ui) {
		writeLog($("#volume").val());
		socket.emit("remoteVolumeChange", $("#volume").val());
	});

	socket.on("sendPlayList", function(newPlaylist) {
		writeLog("Playlist successfully received from Server");
		$("#movieList").empty();
		for (var i = 0; i < newPlaylist.length; i++) {
			$('#movieList').append('<li id= \'' + newPlaylist[i].interalName + '\'><a>' + newPlaylist[i].movieName + '</a></li>').listview('refresh');
		}
		$('#movieList').on('click', 'li', function() {
			writeLog($(this).attr("id"));
			socket.emit("playSpecifTrailer", $(this).attr("id"), function(message){
				writeLog("Feedback: " + message);
			});
		});
	});

}


function stopVideo(){
	writeLog("Stop pressed");
	socket.emit("remoteStop");
}


function disconnect() {
	writeLog("disconnect");
	socket.disconnect();
}


function start() {

	writeLog("Play/Pause pressed");
	socket.emit("remote_playPause");

}

//notify server that this is the new remote client
//only one remote client allowed to control the video 
function registerToServer() {
	socket.emit("remoteClientregister", function() {
		writeLog("Remote Client successfully registered to Server");
	});
}

//logging with timestap
function writeLog(message){
	console.log(new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " " + message);
}