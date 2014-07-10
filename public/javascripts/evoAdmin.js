var socket;
var currentTrailerList;

var allGenres = [];
var allCountries = [];
var connectionEstablished = false;
var config;
var cubeLocation;
var firstConnect = true;

function connect() {

	socket = io();
	//socket = io("http://178.77.68.72:3000", {"reconnect": false});


	socket.on("connect", function() {
		writeLog("connected to Server");
		socket.emit("registerAdmin", function(message) {
			$("#status").html("Verbindung zum Server hergestellt");
			if (message) writeLog("Successfully registered as admin");
			connectionEstablished = true;

			if (firstConnect) {
				$.get("/data/config.json", function(data) {
					writeLog("Config File loaded successfully");
					//console.dir(data);
					config = data;
					console.dir(config);

					for (var v = 0; v < config.cubeLocations.length; v++) {
						//console.log()
						writeLog("config item added");
						$("#locationRadios").append("<div class=\"radio\"><label><input type=\"radio\" class=\"locationRadio\" name=\"location\" id=\"" + v + "\" value=\"" + config.cubeLocations[v] + "\"/>" + config.cubeLocations[v] + "</label></div>");

					}
					$("#locationRadios").trigger("create");

					$(".locationRadio").change(function() {
						cubeLocation = $(this).attr("value");
						loadFile($(this).attr("value"));
						$("#sendFileBtn").show(0);
						$("#changeForm").show(0);

						$('#inputDtTitel').val("");
						$('#inputOVTitel').val("");
						$('#inputYear').val("");
						$('#inputCountry').val("");
						$('#inputOVSprache').val("");
						$('#inputGenre').val("");
						$('#inputMood').val("");
						$('#inputAvailable').val("");
						$('#inputDirector').val("");
						$('#inputActors').val("");
						$('#inputURLDE').val("");
						$('#inputURLOV').val("");
						$('#inputImageURL').val("");
						$('#testAreaPlot').val("");

						$("#remoteUrlNFC").html("CubeURL für die Remoteverbindung (NFC): http://" + config.server.ip + ":" + config.server.port + "/remote?location=" + cubeLocation + "&type=nfc");
						$("#remoteUrlQR").html("CubeURL für die Remoteverbindung (QR): http://" + config.server.ip + ":" + config.server.port + "/remote?location=" + cubeLocation + "&type=qr");
						$("#questionnaireUrlNFC").html("CubeURL für den Fragebogen (NFC): http://" + config.server.ip + ":" + config.server.port + "/questionnaire?location=" + cubeLocation + "&type=nfc");
						$("#questionnaireUrlQR").html("CubeURL für den Fragebogen (QR): http://" + config.server.ip + ":" + config.server.port + "/questionnaire?location=" + cubeLocation + "&type=qr");
						$("#randomUrlNFC").html("CubeURL für den Zufallstrailer (NFC): http://" + config.server.ip + ":" + config.server.port + "/random?location=" + cubeLocation + "&type=nfc");
						$("#randomUrlQR").html("CubeURL für den Zufallstrailer (QR): http://" + config.server.ip + ":" + config.server.port + "/random?location=" + cubeLocation + "&type=qr");

					});

				}).fail(function() {
					writeLog("Error loading file!");
				});
				firstConnect = false;
			}



		});
	});

	socket.on("disconnect", function() {
		$("#status").html("Internetverbindung unterbrochen");
		writeLog("Disconnect detected");
		connectionEstablished = false;
	});

	socket.on("reconnecting", function(nextRetry) {
		$("#status").html("Internetverbindung unterbrochen");
		writeLog("Reconnect detected");
	});

	socket.on("reconnect_failed", function() {
		$("#status").html("Reconnect failed");
	});


}

//add a new location edit config file and send it back to the server
function addNewLocation() {
	writeLog("New location added: " + $('#inputTitel').val());
	$('#addNewLocationDiv').hide(0);
	$('#locationRadios').hide(0);
	$('#info').html("Neue Location hinzugefügt. Lade die Seite neu, um mit der neuen Liste zu arbeiten. <b> UM DIE FILME ONLINE VERFÜGBAR ZU MACHEN MUSS DER SERVER NEU GESTARTET WERDEN!");
	socket.emit("addLocation", $('#inputTitel').val(), function(message) {
		writeLog("Config update " + message);

	});
}

//load the file with all movies from the server
function loadFile(fileName) {


	$.get("/data/" + fileName + ".json", function(data) {
		writeLog("File loaded successfully");
		currentTrailerList = data;
		printTrailerList(currentTrailerList);
		$("#loadFileBtn").hide(0);
		$("#sendFileBtn").show(0);
		$("#addNewLocationDiv").hide(0);

	}).fail(function() {
		writeLog("Error loading file!");
	});

}


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

//fill the table with data from the file
function printTrailerList(movieList) {
	$("#movieList").show(0);
	//$("#changeForm").show(0);
	$(".movielistEntry").each(function() {
		$(this).remove();
	});

	//sort the list alphabetically by movieName
	movieList.sort(self.sort_by(
		'movieName', true, function(a) {
			return a.toUpperCase();
		}));

	for (var v = 0; v < movieList.length; v++) {


		var actorsShort = movieList[v].actors[0] + ", ...";
		var urlDEShort;
		var urlOVShort;
		if (undefined === movieList[v].urlDE) {
			urlDEShort = "";
		} else {
			urlDEShort = movieList[v].urlDE.substring(0, 20) + "...";
		}
		if (undefined === movieList[v].urlOV) {
			urlOVShort = "";
		} else {
			urlOVShort = movieList[v].urlOV.substring(0, 20) + "...";
		}


		$('#movieListTable').append("<tr class=\"movielistEntry\" id=\"" +
			movieList[v].interalName + "\"><td>" +
			(v + 1) + "</td><td>" +
			"<button id=\"" + movieList[v].interalName + "\"  type=\"button\" class=\"btn btn-primary btn-xs deleteBtn\"> Löschen </button>" +
			"<button id=\"" + movieList[v].interalName + "\"  type=\"button\" class=\"btn btn-primary btn-xs editBtn\"> Bearbeiten </button>" + "</td><td>" +
			movieList[v].movieName + "</td><td>" +
			movieList[v].ovName + "</td><td>" +
			movieList[v].year + "</td><td>" +
			movieList[v].country + "</td><td>" +
			movieList[v].ov + "</td><td>" +
			movieList[v].genre + "</td><td>" +
			movieList[v].director + "</td><td>" +
			movieList[v].mood + "</td><td>" +
			movieList[v].available + "</td><td>" +
			actorsShort + "</td><td>" +
			movieList[v].plot.substring(0, 40) + "... " + "</td><td>" +
			urlDEShort + "</td><td>" +
			urlOVShort + "</td><td>" +
			movieList[v].imageURL.substring(0, 20) + "</td><td>" + "</td></tr>");
	}


	$(".deleteBtn").click(function() {
		deleteMovie($(this).attr("id"));
	});
	$(".editBtn").click(function() {
		editMovie($(this).attr("id"));
	});

	currentTrailerList = movieList;
}

//send updated trailer file to server
function sendFileToServer() {

	$("#movieList").hide(0);
	$("#changeForm").hide(0);
	$("#loadFileBtn").show(0);
	$("#sendFileBtn").hide(0);

	if (connectionEstablished) {
		socket.emit("forcePlaylistUpdate", cubeLocation, JSON.stringify(currentTrailerList), function(message) {
			writeLog("playlistupdate: " + message);
		});
	}
}

//add the movie to the movie List
function addMovie() {

	var newEntry = {};
	newEntry.movieName = $('#inputDtTitel').val();
	newEntry.ovName = $('#inputOVTitel').val();

	var sub = $('#inputDtTitel').val();
	var charPosition = -1;
	sub = sub.charAt(0).toLowerCase() + sub.slice(1);

	charPosition = sub.indexOf(" ");

	while (charPosition > 0) {
		sub = sub.substring(0, charPosition) + sub.substr(charPosition + 1, 1).toUpperCase() + sub.substring(charPosition + 2);
		charPosition = sub.indexOf(" ");
	}

	var alreadyExists = false;
	for (var v = 0; v < currentTrailerList.length; v++) {
		if (sub == currentTrailerList[v].interalName) alreadyExists = true;
	}
	if (alreadyExists) sub = sub + "X";

	newEntry.interalName = sub;
	if ("" === $('#inputURLDE').val() || undefined === $('#inputURLDE').val()) {} else {
		newEntry.urlDE = $('#inputURLDE').val();
	}
	if ("" === $('#inputURLOV').val() || undefined === $('#inputURLOV').val()) {} else {
		newEntry.urlOV = $('#inputURLOV').val();
	}
	newEntry.imageURL = $('#inputImageURL').val();
	newEntry.ov = $('#inputOVSprache').val();

	var genres = [];
	charPosition = -1;
	sub = $('#inputGenre').val();
	charPosition = sub.indexOf(",");
	while (charPosition > 0) {
		genres.push(sub.substring(0, charPosition));
		sub = sub.substring(charPosition + 1);
		charPosition = sub.indexOf(",");
	}
	genres.push(sub);
	newEntry.genre = genres;

	newEntry.year = $('#inputYear').val();
	newEntry.director = $('#inputDirector').val();

	var moods = [];
	charPosition = -1;
	sub = $('#inputMood').val();
	charPosition = sub.indexOf(",");
	while (charPosition > 0) {
		moods.push(sub.substring(0, charPosition));
		sub = sub.substring(charPosition + 1);
		charPosition = sub.indexOf(",");
	}
	moods.push(sub);
	newEntry.mood = moods;

	newEntry.available = $('#inputAvailable').val();

	var countries = [];
	charPosition = -1;
	sub = $('#inputCountry').val();
	charPosition = sub.indexOf(",");
	while (charPosition > 0) {
		countries.push(sub.substring(0, charPosition));
		sub = sub.substring(charPosition + 1);
		charPosition = sub.indexOf(",");
	}
	countries.push(sub);
	newEntry.country = countries;

	var actors = [];
	charPosition = -1;
	sub = $('#inputActors').val();
	charPosition = sub.indexOf(",");
	while (charPosition > 0) {
		actors.push(sub.substring(0, charPosition));
		sub = sub.substring(charPosition + 1);
		charPosition = sub.indexOf(",");
	}
	actors.push(sub);
	newEntry.actors = actors;

	newEntry.plot = $('#testAreaPlot').val();

	console.dir(newEntry);

	$('#inputDtTitel').val("");
	$('#inputOVTitel').val("");
	$('#inputYear').val("");
	$('#inputCountry').val("");
	$('#inputOVSprache').val("");
	$('#inputGenre').val("");
	$('#inputDirector').val("");
	$('#inputMood').val("");
	$('#inputAvailable').val("");
	$('#inputActors').val("");
	$('#inputURLDE').val("");
	$('#inputURLOV').val("");
	$('#inputImageURL').val("");
	$('#testAreaPlot').val("");


	currentTrailerList.push(newEntry);
	printTrailerList(currentTrailerList);



}

function deleteMovie(movieInternalName) {
	writeLog("You want to delete " + movieInternalName);
	for (var w = 0; w < currentTrailerList.length; w++) {
		if (currentTrailerList[w].interalName == movieInternalName) {
			currentTrailerList.splice(w, 1);
		}
	}
	printTrailerList(currentTrailerList);
}

function editMovie(movieInternalName) {
	writeLog("You want to edit " + movieInternalName);
	for (var w = 0; w < currentTrailerList.length; w++) {
		if (currentTrailerList[w].interalName == movieInternalName) {
			break;
		}
	}
	$('#inputDtTitel').val(currentTrailerList[w].movieName);
	$('#inputOVTitel').val(currentTrailerList[w].ovName);
	$('#inputYear').val(currentTrailerList[w].year);
	$('#inputCountry').val(currentTrailerList[w].country);
	$('#inputOVSprache').val(currentTrailerList[w].ov);
	$('#inputGenre').val(currentTrailerList[w].genre);
	$('#inputDirector').val(currentTrailerList[w].director);
	$('#inputMood').val(currentTrailerList[w].mood);
	$('#inputAvailable').val(currentTrailerList[w].available);
	$('#inputActors').val(currentTrailerList[w].actors);
	$('#inputURLDE').val(currentTrailerList[w].urlDE);
	$('#inputURLOV').val(currentTrailerList[w].urlOV);
	$('#inputImageURL').val(currentTrailerList[w].imageURL);
	$('#testAreaPlot').val(currentTrailerList[w].plot);
}


function sort_by(field, reverse, primer) {
	var key = function(x) {
		return primer ? primer(x[field]) : x[field];
	};
	return function(a, b) {
		var A = key(a),
			B = key(b);
		return ((A < B) ? -1 : (A > B) ? +1 : 0) * [-1, 1][+!!reverse];
	};
}


//logging with timestap
function writeLog(message) {
	console.log(new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " " + message);
}