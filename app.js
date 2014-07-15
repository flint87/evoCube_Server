var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var io = require('socket.io');
var fs = require('fs');

var routes = require('./routes/index');
var users = require('./routes/users');

//enable logging with different colors
var colors = require('colors');

//mongo db initialization
var dburl = "localhost/evoCube";
var collections = ["movies", "log"];
mydbConnection = require("mongojs").connect(dburl, collections);


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);

app.use(session({
	keys: ['key1', 'key2']
}));

app.use(favicon());
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


var adminClient;
var locationsData = {};
//clear and initiate the movie table
mydbConnection.movies.drop();

//read config file into memory
fs.readFile(__dirname + "/public/data/config.json", "utf8", function(err, data) {
	if (err) {
		return console.log(err);
	}
	data = JSON.parse(data);
	locationsData.locations = [];
	var location = {};
	for (var v = 0; v < data.cubeLocations.length; v++) {
		location = {};
		location.locationName = data.cubeLocations[v];
		locationsData.locations.push(location);
	}
	//read playlists from file into memory
	//and init properties
	for (v = 0; v < locationsData.locations.length; v++) {
		getAndSavePlaylists(locationsData.locations[v].locationName);
		locationsData.locations[v].connectedClients = [];
	}
	//wait until all movie data is read from disc and stored in DB
	//needed because all functions are async
	writeLog("Starting Server - wait a few seconds", "standard");
	setTimeout(function() {
		writeLog("Initialization finished - Connections can be served now", "green");

		var server = app.listen(app.get('port'), function() {
			writeLog('Express server listening on port ' + server.address().port, "standard");
			var sockets = io.listen(server);
			writeLog('Socket.io server listening on port ' + server.address().port + "\n", "standard");

			var secretCode = "xxx";

			sockets.on("connection", function(socket) {

				writeLog("Connection " + socket.id + " accepted", "standard");

				socket.on("disconnect", function() {
					writeLog("Connection " + socket.id + " terminated", "standard");
					try {
						if (socket.id == remoteClient.id) {
							remoteClient = null;
							writeLog("Remote CLient unregistered: " + socket.id, "standard");
						}
					} catch (err) {}

				});


				//##############################
				//MESSAGES FROM CLIENT
				//#############################

				//remote client doesnt want to be remote client anymore and unregisters
				socket.on("dismissRemoteClient", function(cubeLocation, fn) {
					writeLog("Remote Client at " + cubeLocation + " with ID " + socket.id + " not longer remote client", "standard");
					for (v = 0; v < locationsData.locations.length; v++) {
						if (locationsData.locations[v].locationName == cubeLocation) {
							locationsData.locations[v].remoteClient = null;
						}
					}
					fn();
				});

				//client wants control over the monitor
				//check with video client if a trailer is played at the moment
				//if remote connection is ok generate a random code for authentification
				socket.on("giveMeControl", function(cubeLocation, fn) {
					var videoSocket;
					var mySecretCode;
					for (v = 0; v < locationsData.locations.length; v++) {
						if (locationsData.locations[v].locationName == cubeLocation) {
							videoSocket = locationsData.locations[v].videoClient;
							mySecretCode = Math.floor((Math.random() * 900) + 100);
							locationsData.locations[v].secretCode = mySecretCode;
						}
					}
					if (undefined === videoSocket) {
						writeLog("No Video Client at the moment at location: " + cubeLocation, "warn");
					} else {
						videoSocket.emit("isTrailerRunning", function(message) {
							writeLog("Trailer is running: " + message, "standard");
							saveTrackingMessage(getCookie(socket, "userID"), cubeLocation, "normalClient", "playTrailer", "trailerRunning");
							if (message) {
								fn(true);
							} else {
								fn(false);
								videoSocket.emit("setSecret", mySecretCode);
								saveTrackingMessage(getCookie(socket, "userID"), cubeLocation, "normalClient", "playTrailer", "noTrailerRunning");
								writeLog("Secret Code for " + cubeLocation + " is now: " + mySecretCode, "standard");
							}
						});
					}

				});

				//client wants to know if there is a running trailer at the moment
				socket.on("isTrailerRunningAtTheMoment", function(cubeLocation, fn) {
					var videoSocket;
					for (v = 0; v < locationsData.locations.length; v++) {
						if (locationsData.locations[v].locationName == cubeLocation) {
							videoSocket = locationsData.locations[v].videoClient;
						}
					}
					if (undefined === videoSocket) {
						fn("noVideoClientHere");
					} else {
						videoSocket.emit("isTrailerRunning", function(message) {
							if (message) {
								fn("true");
							} else {
								fn("false");
							}
						});
					}
				});

				//remote client wants to check if the submited secret code is correct
				socket.on("checkMyCode", function(cubeLocation, submitedCode, fn) {

					var myLocation;
					for (v = 0; v < locationsData.locations.length; v++) {
						if (locationsData.locations[v].locationName == cubeLocation) {
							writeLog("submitted code: " + submitedCode + " - correct code: " + locationsData.locations[v].secretCode, "standard");
							if (submitedCode == locationsData.locations[v].secretCode) {
								fn(true);
								locationsData.locations[v].videoClient.emit("hideCode", "standard");
								writeLog("HIDE CODE SENT");
								saveTrackingMessage(getCookie(socket, "userID"), cubeLocation, "normalClient", "checkMyCode", "corret");
								if (locationsData.locations[v].remoteClient) {
									locationsData.locations[v].remoteClient.emit("byebyeRemote", "standard");
								}
								locationsData.locations[v].remoteClient = socket;
								writeLog("New remote client at " + locationsData.locations[v].locationName + " is client with ID: " + locationsData.locations[v].remoteClient.id, "standard");
							} else {
								fn(false);
								saveTrackingMessage(getCookie(socket, "userID"), cubeLocation, "normalClient", "checkMyCode", "inCorrect");
							}
						}
					}
				});


				//the calling clients check regulary if they have control about the monitor or not
				socket.on("inCharge", function(cubeLocation, fn) {
					for (v = 0; v < locationsData.locations.length; v++) {
						if (locationsData.locations[v].locationName == cubeLocation) {
							try {

								if (socket.id == locationsData.locations[v].remoteClient.id) {
									fn(true);
								} else {
									fn(false);
								}
							} catch (err) {
								fn(false);
							}
						}
					}
				});

				//accept a tracking message from the client and save it
				socket.on("writeTracking", function(cubeLocation, eventType, message, parameter) {
					saveTrackingMessage(getCookie(socket, "userID"), cubeLocation, eventType, message, parameter);
				});

				//remote Play or Pause commando received from the remote client
				socket.on("remote_playPause", function() {
					writeLog("Remote Play/Pause received", "standard");
					videoClient.emit("playPause");

				});

				//remote Volume change income from remote client
				socket.on("remoteVolumeChange", function(newVolume) {
					writeLog("Remote VolumeChange received: " + newVolume, "standard");
					videoClient.emit("volumeChange", newVolume);
				});

				//inform the server about the newest client
				socket.on("clientRegister", function(cubeLocation, fn) {
					writeLog("Client from " + cubeLocation + " registered to Server with ID: " + socket.id, "standard");
					fn();
				});

				//get command from remote client to play a specific trailer
				socket.on("playSpecifTrailer", function(cubeLocation, trailerInternalName, trailerType, fn) {
					writeLog("Remote Client from " + cubeLocation + "wants to play: " + trailerInternalName, "standard");
					for (v = 0; v < locationsData.locations.length; v++) {
						if (locationsData.locations[v].locationName == cubeLocation) {
							if (socket.id == locationsData.locations[v].remoteClient.id) {
								locationsData.locations[v].videoClient.emit("playSpecifTrailer", trailerInternalName, trailerType);
								//saveTrackingMessage(getCookie(socket, "userID"), cubeLocation, "remoteClient", "playSpecificTrailer", trailerInternalName);
								fn("success");
							} else {
								fn("fail");
							}
						}
					}
				});

				//get command from remote client to play a specific trailer
				socket.on("remoteStop", function() {
					writeLog("Remote Client wants to stop", "standard");
					videoClient.emit("stopTrailer");

				});

				//get command from remote client for a filtering query
				socket.on("queryDB", function(myCubeLocation, filteringQuery, fn) {
					saveTrackingMessage(getCookie(socket, "userID"), myCubeLocation, "normalClient", "queryDB", "");

					mydbConnection.movies.find({
						$and: [{
							genre: {
								$in: filteringQuery.genre
							}
						}, {
							country: {
								$in: filteringQuery.country
							}
						}, {
							year: {
								$in: filteringQuery.year
							}
						}, {
							ov: {
								$in: filteringQuery.ov
							}
						}, {
							mood: {
								$in: filteringQuery.mood
							}
						}, {
							cubeLocation: myCubeLocation
						}]
					}, function(err, queryResult) {
						if (err || !users) {
							writeLog("DB ERROR at database query: ", "error");
						} else {
							writeLog(queryResult.length + " Movies found in DB", "standard");
							var shortResult = [];
							for (i = 0; i < queryResult.length; i++) {
								writeLog(queryResult[i].movieName);
								shortResult.push(queryResult[i].interalName);
								console.dir(shortResult);
							}
							fn(shortResult);
						}

					});

				});

				//##############################
				//MESSAGES FROM QUESTIONNAIRE CLIENT
				//#############################

				//client wants to fill out the questionnaire
				//but he was to visit the remote and as well the random sites before
				socket.on("questionRegister", function(cubeLocation, fn) {
					var questionnaireAllowed = false;

					if (getCookie(socket, "remoteVisited") == "true") {
						if (getCookie(socket, "randomVisited") == "true") {
							questionnaireAllowed = true;

						}
					}
					writeLog("Question Client from " + cubeLocation + " registered to Server with ID: " + socket.id + "Allowed to fill out the questionnaire: " + questionnaireAllowed, "standard");
					saveTrackingMessage(getCookie(socket, "userID"), cubeLocation, "normalClient", "registerAtQuestionnaire", questionnaireAllowed);
					fn(questionnaireAllowed);
				});

				//##############################
				//MESSAGES FROM ADMIN CLIENT
				//#############################

				//admin changed the playlist and wants to update the local file and the video client 
				socket.on("forcePlaylistUpdate", function(cubeLocation, newPlaylist, fn) {

					fs.writeFile(__dirname + "/public/data/" + cubeLocation + ".json", newPlaylist, "utf8", function(err) {
						if (err) {
							fn(false);
							console.log(err);
						} else {
							playList = JSON.parse(newPlaylist);
							for (v = 0; v < locationsData.locations.length; v++) {
								if (locationsData.locations[v].locationName == cubeLocation) {
									locationsData.locations[v].movieList = JSON.parse(newPlaylist);

									myVideoClient = locationsData.locations[v].videoClient;
									//console.dir(locationsData.locations[v].movieList);
									writeLog("New playlist for " + cubeLocation + " successfully updated at Server", "warn");
								}
							}
							saveNewPlayListToDB(cubeLocation);

							if (undefined === myVideoClient || null === myVideoClient) {} else {
								myVideoClient.emit("updatePlaylist", function() {
									writeLog("New playlist " + cubeLocation + "successfully sent to video client", "warn");
								});
							}
							fn(true);
						}
					});
				});

				//admin changed the playlist and wants to update the local file and the video client 
				socket.on("addLocation", function(cubeLocation, fn) {
					fs.readFile(__dirname + "/public/data/config.json", "utf8", function(err, data) {
						if (err) {
							writeLog("Error reading config File for location adding", "error");
						} else {
							data = JSON.parse(data);
							data.cubeLocations.push(cubeLocation);
							//update the config file
							fs.writeFile(__dirname + "/public/data/config.json", JSON.stringify(data), "utf8", function(err) {
								if (err) {
									writeLog("Error writing config File for location adding", "error");
								} else {
									//load the template file for the new movie
									fs.readFile(__dirname + "/public/data/template.json", "utf8", function(err, data) {
										if (err) {
											writeLog("Error reading template File for location adding", "error");
										} else {
											//make a new JSON file to store the movies
											fs.writeFile(__dirname + "/public/data/" + cubeLocation + ".json", data, "utf8", function(err) {
												if (err) {
													writeLog("Error writing new json file for location adding", "error");
												} else {
													writeLog("Config File successfully updated", "warn");
													fn("success");
												}
											});
										}
									});
								}
							});
						}
					});
				});

				//admin page wants to connect to the server
				socket.on("registerAdmin", function(fn) {
					writeLog("ADMIN connected with ID: " + socket.id, "green");
					adminClient = socket;
					fn(true);

				});

				//##############################
				//MESSAGES FROM VIDEO CLIENT
				//#############################

				//register the newest video client to server
				socket.on("videoClientregister", function(locationOfCubeToRegister, fn) {

					for (v = 0; v < locationsData.locations.length; v++) {
						if (locationsData.locations[v].locationName == locationOfCubeToRegister) {
							locationsData.locations[v].videoClient = socket;
						}
					}
					writeLog("VIDEO Client from location " + locationOfCubeToRegister + " registered with ID: " + socket.id, "green");

					fn(true);
				});



			});


		});


	}, 5000);
});



function saveNewPlayListToDB(locationName) {
	mydbConnection.movies.remove({
		"cubeLocation": locationName
	});
	for (var v = 0; v < locationsData.locations.length; v++) {
		if (locationsData.locations[v].locationName == locationName) {
			for (var x = 0; x < locationsData.locations[v].movieList.length; x++) {
				locationsData.locations[v].movieList[x].cubeLocation = locationName;
				saveMovieEntry(locationsData.locations[v].movieList[x]);

			}

		}
	}

	function saveMovieEntry(newEntry) {
		mydbConnection.movies.save(newEntry, function(error, savedEntry) {
			if (error) {
				console.log(error);
			} else {
				//console.log(savedEntry.movieName + " " + savedEntry.cube);
			}

		});

	}
}

function getAndSavePlaylists(locationName) {
	fs.readFile(__dirname + "/public/data/" + locationName + ".json", "utf8", function(err, data) {
		if (err) {
			return console.log(err);
		}
		data = JSON.parse(data);

		for (var v = 0; v < locationsData.locations.length; v++) {
			if (locationsData.locations[v].locationName == locationName) {
				locationsData.locations[v].movieList = data;
			}
		}
		saveNewPlayListToDB(locationName);
	});
}



//logging with timestap
function writeLog(message, type) {
	var hours = new Date().getHours();
	var minutes = new Date().getMinutes();
	var seconds = new Date().getSeconds();
	var year = new Date().getFullYear();
	var month = new Date().getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;
	var day = new Date().getDate();
	day = (day < 10 ? "0" : "") + day;
	if (hours < 10) hours = "0" + hours;
	if (minutes < 10) minutes = "0" + minutes;
	if (seconds < 10) seconds = "0" + seconds;

	switch (type) {
		case "standard":
			console.log((day + "." + month + "." + year + " " + hours + ":" + minutes + ":" + seconds + ": " + message));
			break;
		case "green":
			console.log((day + "." + month + "." + year + " " + hours + ":" + minutes + ":" + seconds + ": " + message).green);
			break;
		case "warn":
			console.log((day + "." + month + "." + year + " " + hours + ":" + minutes + ":" + seconds + ": " + message).yellow);
			break;
		case "error":
			console.log((day + "." + month + "." + year + " " + hours + ":" + minutes + ":" + seconds + ": " + message).red);
			break;
	}
}

//get timestamp for the log file
function getTimeStamp() {
	var hours = new Date().getHours();
	var minutes = new Date().getMinutes();
	var seconds = new Date().getSeconds();
	var year = new Date().getFullYear();
	var month = new Date().getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;
	var day = new Date().getDate();
	day = (day < 10 ? "0" : "") + day;
	if (hours < 10) hours = "0" + hours;
	if (minutes < 10) minutes = "0" + minutes;
	if (seconds < 10) seconds = "0" + seconds;
	return day + "." + month + "." + year + " " + hours + ":" + minutes + ":" + seconds;
}

//save new tracking message to file
function saveTrackingMessage(userID, locationName, eventType, message, parameter) {
	var myTimeStamp = getTimeStamp();
	fs.readFile("C:/evoCubeLog.csv", "utf8", function(err, data) {

		if (err) {
			console.log("Reading error");
			console.log(err);
		} else {
			data = data + myTimeStamp + ";" + userID + ";" + locationName + ";" + eventType + ";" + message + ";" + parameter + "\n";
			fs.writeFile("C:/evoCubeLog.csv", data, "utf8", function(err) {
				if (err) {
					writeLog("File writting error at saving Log Entry to file", "error");
				} else {}
			});
		}
	});

	var newEntry = {};
	newEntry.timeStamp = myTimeStamp;
	newEntry.userID = userID;
	newEntry.locationName = locationName;
	newEntry.eventType = eventType;
	newEntry.message = message;
	newEntry.parameter = parameter;

	mydbConnection.log.save(newEntry, function(error, savedEntry) {
		if (error) {
			writeLog("DB Error at saving Log Entry", "error");
		}

	});

}

//extracts the cookie content from the given cookie name
function getCookie(mySocket, cname) {
	var name = cname + "=";
	var ca = mySocket.handshake.headers.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1);
		if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
	}
	return "";
}

module.exports = app;