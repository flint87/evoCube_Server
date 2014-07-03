var socket;
var initState = 0;
var trailers;
//set the time when a remote connection should be closed automatically. 10 minutes at the moment.
var disconnectTimeout = 600000;
var myDisconnectTimer;

setInterval(function() {
	socket.emit("inCharge", function(message) {
		//writeLog("Main client: " + message);				
		if (message) {
			$("#feedback").html("Du bist jetzt mit dem Fernseher verbunden und kannst dir beliebige Trailer anschauen.");
		} else {
			if (initState == "noRemoteConnection") {
				$("#feedback").html("Du bist momentan nicht mit dem Fernseher verbunden. Tippe hier um eine Verbindung herzustellen.");
				clearTimeout(myDisconnectTimer);
			}
		}
	});

}, 2000);

function connect() {

	var myCodeTimer;

	$("#infoBtn").html("&nbsp;");

	socket = io("192.168.0.29:3000", {
		"reconnect": false
	});
	//socket = io("http://178.77.68.72:3000", {"reconnect": false});

	//hide the movie control items at startup
	//$("#movieControls").hide(1);

	socket.on("connect", function() {
		//$("#status").html("Verbindung hergestellt");
		$("#status").fadeOut("normal");
		registerToServer();
		writeLog("connected");
	});
	socket.on("disconnect", function() {
		$("#status").html("Internetverbindung unterbrochen");
		$("#status").fadeIn("normal");
		//$("#status").html("Disconnected from Server");
		writeLog("Disconnect detected");
		$("#movieControls").fadeOut("normal");
		$("#initElements").fadeIn("normal");
		initState = "noRemoteConnection";
	});
	socket.on("reconnecting", function(nextRetry) {
		$("#status").html("Internetverbindung unterbrochen");
		$("#status").fadeIn("normal");
		//$("#status").html("Reconnecting in " + nextRetry + " milliseconds");
		writeLog("Reconnect detected");
		$("#movieControls").fadeOut("normal");
		$("#initElements").fadeIn("normal");
		initState = "noRemoteConnection";
	});

	//server revokes remote client rights
	socket.on("byebyeRemote", function() {
		$("#feedback").html("Du bist momentan nicht mit dem Fernseher verbunden. Tippe hier um eine Verbindung herzustellen.");
		$("#initElements").fadeIn("normal");
		$("#movieControls").fadeOut("normal");
	});

	socket.on("reconnect_failed", function() {
		$("#status").html("Reconnect failed");
	});

	$("#volume").bind("change", function(event, ui) {
		writeLog($("#volume").val());
		socket.emit("remoteVolumeChange", $("#volume").val() * 2);
	});

	socket.on("sendPlayList", function(newPlaylist) {
		writeLog("Playlist successfully received from Server");
		trailers = newPlaylist;
		$("#movieList").empty();
		for (var i = 0; i < newPlaylist.length; i++) {
			$('#movieList').append('<li id= \'' + newPlaylist[i].interalName + '\'><a>' + newPlaylist[i].movieName + '</a></li>').listview('refresh');
		}

		$('#movieList').on('click', 'li', function() {
			showMovieDetails($(this).attr("id"));
		});
	});

}

//play a specific Trailer if you are connected to the monitor
function playTrailer(trailerType) {
	writeLog("I want to see: " + trailerType + " " + $("#movieName").attr("name"));
	socket.emit("inCharge", function(message) {
		if (message) {
			socket.emit("playSpecifTrailer", $("#movieName").attr("name"), trailerType, function(message) {
				writeLog("Feedback: " + message);
			});
		} else {
			$("html, body").animate({
				scrollTop: $('#feedback').offset().top
			}, "slow");
		}
	});
}

//notify the server that you don't want to be remote client anymore
function revokeRemote() {
	socket.emit("dismissRemoteClient", function() {
		writeLog("Successfully unregistered. You are not remote client anymore");
		initState = "noRemoteConnection";
		$("#initElements").show(0);
		$("#movieControls").fadeOut("normal");
		$("#feedback").html("Du bist momentan nicht mit dem Fernseher verbunden. Tippe hier um eine Verbindung herzustellen.");
	});
}

//notify the server that remote client wants to take control of the video client's monitor
function giveMeControl() {
	socket.emit("giveMeControl", function(answer) {
		//only allow a connection if no trailer is running at the moment
		if (answer) {
			$("#feedback").html("Zurzeit läuft gerade ein Trailer auf dem Fernseher.");
		} else {
			$("#feedback").html("Gib die Nummer ein, die du am Fenseher siehst und tippe auf Bestätigen");
			$("#initElements").hide(0);
			$("#codeElements").fadeIn("normal");
			initState = "waitingForCode";
			$("html, body").animate({
				scrollTop: $('#codeElements').offset().top
			}, "slow");
			//after 20 seconds reset the state
			myCodeTimer = setTimeout(function() {
				$("#feedback").html("Du bist momentan nicht mit dem Fernseher verbunden. Tippe hier um eine Verbindung herzustellen.");
				$("#initElements").fadeIn("normal");
				$("#codeElements").fadeOut("normal");
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
			$("#codeElements").fadeOut("normal");
			$("#movieControls").fadeIn("normal");
			initState = "established";
			$("#secret").val("");
			clearTimeout(myCodeTimer);
			$("html, body").animate({
				scrollTop: $('#movieControls').offset().top
			}, 0);
			//remote rights should not be forever..
			myDisconnectTimer = setTimeout(function() {
				revokeRemote();
			}, disconnectTimeout);
		} else {
			//Code was incorrect. Waiting for correct code until the timeout mechanism strokes
			$("#feedback").html("Der Code war leider nicht richtig. Probiere es noch einmal.");
		}
	});
}

//show info page and hide the rest
function showInfo() {
	$("#content").fadeOut("normal");
	$("#infoContent").fadeIn("normal");
	$("#infoBackBtn").show(0);
	$("#infoBtn").hide(0);
	$("#title").html("Info");

}

//go back from info page to main page
function goBackFromInfo() {
	$("#content").fadeIn("normal");
	$("#infoContent").hide(0);
	$("#infoBackBtn").hide(0);
	$("#infoBtn").show(0);
	$("#title").html("MovieMatcher");
}

//go back from detail view to movie list
function goBackToList() {
	$("#backBtn").hide(0);
	$("#movieListContainer").fadeIn("normal");
	$("#movieContainer").fadeOut("normal");
	$("#title").html("MovieMatcher");
	$("#infoBtn").show(0);
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

//show movie detail page and fill the grid with data
function showMovieDetails(movieInternalName) {
	$("#infoBtn").hide(0);
	writeLog("I want to see details of: " + movieInternalName);
	$("#backBtn").show(0);
	$("#title").html("Filmdetails");
	$("#dtTrailerBtn").attr("onClick", "playTrailer(\"dt\")");
	$("#ovTrailerBtn").attr("onClick", "playTrailer(\"ov\")");
	for (var i = 0; i < trailers.length; i++) {
		if (trailers[i].interalName == movieInternalName) {
			$("#movieName").html(trailers[i].movieName + "<br>");
			$("#movieName").attr("name", trailers[i].interalName);
			$("#movieImg1").attr("src", trailers[i].imageURL);
			$("#movieImg2").attr("src", trailers[i].imageURL);
			if (trailers[i].hasOwnProperty('urlOV')) {
				$('#ovTrailerBtn').show(0);
			} else {
				$('#ovTrailerBtn').hide(0);
			}
			if (trailers[i].hasOwnProperty('urlDE')) {
				$('#deTrailerBtn').show(0);
			} else {
				$('#deTrailerBtn').hide(0);
			}
			$("#ovName").html(trailers[i].ovName);
			$("#year").html(trailers[i].year);
			$("#ov").html(trailers[i].ov);
			var countries = "";
			for (var u = 0; u < trailers[i].country.length; u++) {
				if (u !== trailers[i].country.length - 1) {
					countries = countries + trailers[i].country[u] + ", ";
				} else {
					countries = countries + trailers[i].country[u];
				}
			}
			$("#country").html(countries);
			var genres = "";
			for (u = 0; u < trailers[i].genre.length; u++) {
				if (u !== trailers[i].genre.length - 1) {
					genres = genres + trailers[i].genre[u] + ", ";
				} else {
					genres = genres + trailers[i].genre[u];
				}
			}
			$("#genre").html(genres);
			$("#director").html(trailers[i].director);
			var actors = "";
			for (u = 0; u < trailers[i].actors.length; u++) {
				if (u !== trailers[i].actors.length - 1) {
					actors = actors + trailers[i].actors[u] + "<br> ";
				} else {
					actors = actors + trailers[i].actors[u];
				}
			}
			$("#actors").html(actors);
			$("#plot").html(trailers[i].plot);
		}
		$("#movieListContainer").fadeOut("normal");
		$("#movieContainer").fadeIn("normal");
		$('body').scrollTop(0);
	}
}

//logging with timestap
function writeLog(message) {
	console.log(new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " " + message);
}