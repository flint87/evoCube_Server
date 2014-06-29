var ua = require('universal-analytics');
var visitor = ua('UA-52372095-1').debug();

var socket;

function connect(){


	visitor.pageview("/remoteClient").send();
	//socket = io("192.168.0.29:3000");
	socket = io("http://178.77.68.72:3000");
				
	socket.on("connect", function(){
		$("#status").html("Connected to Server");
	});
	socket.on("disconnect", function(){
		$("#status").html("Disconnected from Server");
	});
	socket.on("reconnecting", function(nextRetry){
		$("#status").html("Reconnecting in " + nextRetry + " milliseconds");
	});
	socket.on("reconnect_failed", function(){
		$("#status").html("Reconnect failed");
	});

	$( "#volume" ).bind( "change", function(event, ui) {  	
  		console.log($("#volume").val());
  		socket.emit("remoteVolumeChange", $("#volume").val());
	});

}


function disconnect(){
	console.log("disconnect");
	socket.disconnect();
}


function start(){

	visitor.event("Play Pause Pressed T client", "Event Action", "index", 42).send();
	console.log("Play/Pause pressed");
	socket.emit("remote_playPause");

}
