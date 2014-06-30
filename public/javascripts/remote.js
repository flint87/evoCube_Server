var socket;

function connect() {



	socket = io("192.168.0.29:3000");
	//socket = io("http://178.77.68.72:3000");

	socket.on("connect", function() {
		$("#status").html("Connected to Server");
		registerToServer();
	});
	socket.on("disconnect", function() {
		$("#status").html("Disconnected from Server");
	});
	socket.on("reconnecting", function(nextRetry) {
		$("#status").html("Reconnecting in " + nextRetry + " milliseconds");
	});
	socket.on("reconnect_failed", function() {
		$("#status").html("Reconnect failed");
	});

	$("#volume").bind("change", function(event, ui) {
		console.log($("#volume").val());
		socket.emit("remoteVolumeChange", $("#volume").val());
	});

	socket.on("sendPlayList", function(newPlaylist) {
		console.log("Playlist successfully received from Server");
		for (var i = 0; i < newPlaylist.length; i++) {
			$('#movieList').append('<li id= \'' + newPlaylist[i].interalName + '\'><a>' + newPlaylist[i].movieName + '</a></li>').listview('refresh');
		}
		$('#movieList').on('click', 'li', function() {
			console.log($(this).attr("id"));
			socket.emit("playSpecifTrailer", $(this).attr("id"));
		});
	});

}


function stopVideo(){
	console.log("Stop pressed");
	socket.emit("remoteStop");
}


function disconnect() {
	console.log("disconnect");
	socket.disconnect();
}


function start() {

	console.log("Play/Pause pressed");
	socket.emit("remote_playPause");

}

//notify server that this is the new remote client
//only one remote client allowed to control the video 
function registerToServer() {
	socket.emit("remoteClientregister", function() {
		console.log("Remote Client successfully registered to Server");
	});
}