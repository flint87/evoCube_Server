var socket;
var initState = "noRemoteConnection";
var trailers;
//set the time when a remote connection should be closed automatically. 10 minutes at the moment.
var disconnectTimeout = 600000;
var myDisconnectTimer;

//enable or disable socket.io debug messages on the client
//localStorage.setItem('debug', "*");
localStorage.setItem('debug', "");


var allGenres = [];
var allYears = [];
var allOV = [];
var allCountries = [];
var allMoods = [];
var cubeLocation;
var firstConnect = true;



function connect() {

	showLoader();

	var myCodeTimer;

	socket = io();
	//socket = io("http://178.77.68.72:3000", {"reconnect": false});

	//hide the movie control items at startup
	//$("#movieControls").hide(1);

	socket.on("connect", function() {
		//$("#status").html("Verbindung hergestellt");
		$("#status").hide(0);
		getMovieList();
		writeLog("connected");
	});
	socket.on("disconnect", function() {
		$("#status").html("Internetverbindung unterbrochen");
		$("#status").show(0);
		//$("#status").html("Disconnected from Server");
		writeLog("Disconnect detected");
		$("#movieControls").hide(0);
		$("#initElements").show(0);
		initState = "noRemoteConnection";
	});
	socket.on("reconnecting", function(nextRetry) {
		$("#status").html("Internetverbindung unterbrochen");
		$("#status").show(0);
		//$("#status").html("Reconnecting in " + nextRetry + " milliseconds");
		writeLog("Reconnect detected");
		$("#movieControls").hide(0);
		$("#initElements").show(0);
		initState = "noRemoteConnection";
	});

	//server revokes remote client rights
	socket.on("byebyeRemote", function() {
		$("#feedback").html("Tippe hier um dich mit dem Fernseher zu verbinden.");
		$("#initElements").show(0);
		$("#movieControls").hide(0);
	});

	socket.on("reconnect_failed", function() {
		$("#status").html("Reconnect failed");
	});
}

//get the corresponding list of movies from the server
function getMovieList() {

	//get the query parameters to determine to which cubeLocation this page call belongs to
	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		// If first entry with this name
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = pair[1];
			// If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
			var arr = [query_string[pair[0]], pair[1]];
			query_string[pair[0]] = arr;
			// If third or later entry with this name
		} else {
			query_string[pair[0]].push(pair[1]);
		}
	}
	cubeLocation = query_string.location;

	if (firstConnect) {

		//load the movie list from the server		
		$.get("/data/" + cubeLocation + ".json", function(data) {
			writeLog("File loaded successfully");
			trailers = data;
			showMovieDetails(trailers[Math.floor((Math.random() * trailers.length))].interalName);


			
		}).fail(function() {
			writeLog("Error loading file!!!");
		});

		firstConnect = false;
	}
}


//play a specific Trailer if you are connected to the monitor
function playTrailer(trailerType) {

	writeLog("INIT STATE: " + initState);

	if (initState == "noRemoteConnection") {
		socket.emit("isTrailerRunningAtTheMoment", cubeLocation, function(answer) {
			writeLog("FEEDBACK: " + answer);
			if (answer == "false") {
				$("#feedback").html("Tippe hier um dich mit dem Fernseher zu verbinden.");
				$("#initElements").show(0);
				$("#abortConnection").html("Abbrechen");
			} else if (answer == "true") {
				$("#feedback").html("Zurzeit läuft gerade ein Trailer auf dem Fernseher.");
				$("#initElements").hide(0);
				$("#abortConnection").html("OK");
			} else if (answer == "noVideoClientHere") {
				$("#feedback").html("Kein Video Client im Moment.");
				$("#initElements").hide(0);
				$("#abortConnection").html("OK");
			}
			$("#feedbackPopup").popup("open");
		});
	} else {
		writeLog("I want to see: " + trailerType + " " + $("#movieName").attr("name"));
		socket.emit("inCharge", cubeLocation, function(message) {
			if (message) {
				socket.emit("playRandomTrailer", cubeLocation, $("#movieName").attr("name"), trailerType, function(message) {
					writeLog("Feedback: " + message);
					socket.emit("writeTracking", cubeLocation, "randomClientEvent", "playTrailer", $("#movieName").attr("name"), function() {});
				});
			} else {}
		});
	}
}

//notify the server that you don't want to be remote client anymore
function revokeRemote() {
	socket.emit("dismissRemoteClient", cubeLocation, function() {
		writeLog("Successfully unregistered. You are not remote client anymore");
		initState = "noRemoteConnection";
		clearTimeout(myDisconnectTimer);
		$("#initElements").show(0);
		$("#movieControls").hide(0);
		$("#feedback").html("Tippe hier um dich mit dem Fernseher zu verbinden.");
	});
}

//notify the server that remote client wants to take control of the video client's monitor
function giveMeControl() {
	socket.emit("giveMeControl", cubeLocation, function(answer) {
		//only allow a connection if no trailer is running at the moment
		if (answer) {
			$("#feedback").html("Zurzeit läuft gerade ein Trailer auf dem Fernseher.");
		} else {
			$("#feedback").html("Bestätigungsnummer eingeben");
			$("#initElements").hide(0);
			$("#codeElements").show(0);
			initState = "waitingForCode";
			//after 20 seconds reset the state
			myCodeTimer = setTimeout(function() {
				$("#feedback").html("Tippe hier um dich mit dem Fernseher zu verbinden.");
				$("#initElements").show(0);
				$("#codeElements").hide(0);
			}, 20000);
		}
	});
}

//hide the popup or cancel the connection attempt
function abortConnect() {
	if (initState == "established") {
		$("#feedbackPopup").popup("close");
		$("#abortConnection").html("Abbrechen");
	} else {
		initState = "noRemoteConnection";
		$("#feedbackPopup").popup("close");
		setTimeout(function() {
			$("#initElements").show(0);
			$("#codeElements").hide(0);
		}, 200);
	}
}

//check with the server if the code is correct. if yes grant access to monitor
function submitCode() {
	writeLog("Secret Value: " + $("#secret").val());
	socket.emit("checkMyCode", cubeLocation, $("#secret").val(), function(answer) {
		if (answer) {
			$("#feedback").html("Du bist jetzt mit dem Fernseher verbunden und kannst dir nun die Trailer anschauen.");
			$("#codeElements").hide(0);
			initState = "established";
			$("#secret").val("");
			clearTimeout(myCodeTimer);
			$("#abortConnection").html("OK");

			//remote rights should not be forever..
			myDisconnectTimer = setTimeout(function() {
				revokeRemote();
			}, disconnectTimeout);
		} else {
			//Code was incorrect. Waiting for correct code until the timeout mechanism strokes
			$("#feedback").html("Die Nummer war leider nicht richtig.");
		}
	});
}

//show the loading spinner
function showLoader() {
	$.mobile.loading("show", {
		text: "Laden",
		textVisible: true,
		theme: $.mobile.loader.prototype.options.theme,
		textonly: false,
		html: ""
	});
	hideLoader();
}

//hide the loading spinner
function hideLoader() {
	$.mobile.loading("hide");
}

function disconnect() {
	writeLog("disconnect");
	socket.disconnect();
}

//show movie detail page and fill the grid with data
function showMovieDetails(movieInternalName) {
	socket.emit("writeTracking", cubeLocation, "clientEvent", "showMovieDetails", "movieInternalName", function() {});
	$("#infoBtn").hide(0);
	$("#infoBtn").hide(0);
	$("#movieContainerBackBtn").hide(0);
	writeLog("I want to see details of: " + movieInternalName);
	$("#backBtn").show(0);
	$("#title").html("Movie Cube");
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
				$('#dtTrailerBtn').show(0);
				writeLog("GERMAN TRAILER DETECTED");
			} else {
				$('#dtTrailerBtn').hide(0);
				writeLog("NO GERMAN TRAILER DETECTED");
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

			var moods = "";
			for (u = 0; u < trailers[i].mood.length; u++) {
				if (u !== trailers[i].mood.length - 1) {
					moods = moods + trailers[i].mood[u] + ", ";
				} else {
					moods = moods + trailers[i].mood[u];
				}
			}
			$("#mood").html(moods);

			$("#available").html(trailers[i].available);

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
		$("#movieContainer").show(0);
	}
}


//##############################
//Utility Functions
//#############################

//get a list of all unique values of the array
function getUniques(myArray) {
	var cleaned = [];
	myArray.forEach(function(itm) {
		var unique = true;
		cleaned.forEach(function(itm2) {
			if (itm == itm2) unique = false;
		});
		if (unique) cleaned.push(itm);
	});
	return cleaned;
}


//logging with timestap
function writeLog(message) {
	console.log(new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " " + message);
}