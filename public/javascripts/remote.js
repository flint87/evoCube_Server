var socket;

function connect(){

	socket = io("192.168.0.29:3000");

				
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


}

function disconnect(){
	console.log("disconnect");
	socket.disconnect();
}


function start(){

	console.log("Play/Pause pressed");
	socket.emit("remote_playPause");

}
