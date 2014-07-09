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
	writeLog("Starting Server - wait a few seconds");
	setTimeout(function() {
		writeLog("Initialization finished - Connections can be served now");

		var server = app.listen(app.get('port'), function() {
			writeLog('Express server listening on port ' + server.address().port);


			var sockets = io.listen(server);
			writeLog('Socket.io server listening on port ' + server.address().port + "\n");
			//var videoClient; //holds the socket ID of the newest video client
			//var remoteClient = null; //holds the socket ID of the newest remote client

			var secretCode = "xxx";


			//give periodically feedback if there is a remote client at the moment
			/*
			setInterval(function() {
				for (v = 0; v < locationsData.locations.length; v++) {
					try {
						writeLog("Remote Client at at location :" + locationsData.locations[v].locationName + " the moment: " + locationsData.locations[v].remoteClient.id);
					} catch (err) {
						writeLog("No remote client at the moment at location : " + locationsData.locations[v].locationName);
					}
				}
			}, 60000);
*/

			sockets.on("connection", function(socket) {



				//writeLog("######################Cookie from app.js " + socket.handshake.headers.cookie);

				//writeLog("######################Cookie User ID: " + getCookie("userID"));

				writeLog("Connection " + socket.id + " accepted");

				socket.on("disconnect", function() {
					writeLog("Connection " + socket.id + " terminated");
					try {
						if (socket.id == remoteClient.id) {
							remoteClient = null;
							writeLog("Remote CLient unregistered: " + socket.id);
						}
					} catch (err) {}

				});


				//##############################
				//MESSAGES FROM REMOTE CLIENT
				//#############################

				//remote client doesnt want to be remote client anymore and unregisters
				socket.on("dismissRemoteClient", function(cubeLocation, fn) {
					writeLog("Remote Client at " + cubeLocation + " with ID " + socket.id + " not longer remote client");
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
						writeLog("No Video Client at the moment");
					} else {
						videoSocket.emit("isTrailerRunning", function(message) {
							writeLog("Trailer is running: " + message);
							if (message) {
								fn(true);
							} else {
								fn(false);
								videoSocket.emit("setSecret", mySecretCode);
								writeLog("Secret Code for " + cubeLocation + " is now: " + mySecretCode);
							}
						});
					}

				});

				//remote client wants to check if the submited secret code is correct
				socket.on("checkMyCode", function(cubeLocation, submitedCode, fn) {

					var myLocation;
					for (v = 0; v < locationsData.locations.length; v++) {
						if (locationsData.locations[v].locationName == cubeLocation) {
							writeLog("submitted code: " + submitedCode + " - correct code: " + locationsData.locations[v].secretCode);
							if (submitedCode == locationsData.locations[v].secretCode) {
								fn(true);
								locationsData.locations[v].videoClient.emit("hideCode");
								writeLog("HIDE CODE SENT");
								if (locationsData.locations[v].remoteClient) {
									locationsData.locations[v].remoteClient.emit("byebyeRemote");
								}
								locationsData.locations[v].remoteClient = socket;
								writeLog("New remote client at " + locationsData.locations[v].locationName + " is client with ID: " + locationsData.locations[v].remoteClient.id);
							} else {
								fn(false);
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

				//remote Play or Pause commando received from the remote client
				socket.on("remote_playPause", function() {
					writeLog("Remote Play/Pause received");
					videoClient.emit("playPause");

				});

				//remote Volume change income from remote client
				socket.on("remoteVolumeChange", function(newVolume) {
					writeLog("Remote VolumeChange received: " + newVolume);
					videoClient.emit("volumeChange", newVolume);
				});

				//inform the server about the newest client
				socket.on("clientRegister", function(cubeLocation, fn) {
					function getCookie(cname) {
						var name = cname + "=";
						var ca = socket.handshake.headers.cookie.split(';');
						for (var i = 0; i < ca.length; i++) {
							var c = ca[i];
							while (c.charAt(0) == ' ') c = c.substring(1);
							if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
						}
						return "";
					}
					if (getCookie("remoteVisited") == "true") {
						console.log("####################: Remote visited " + getCookie("remoteVisited"));
					} else {
						console.log("####################: Remote visited false");
					}
					if (getCookie("randomVisited") == "true") {
						console.log("####################: Random visited " + getCookie("randomVisited"));
					} else {
						console.log("####################: Random visited FALSE");
					}

					writeLog("Client from " + cubeLocation + " registered to Server with ID: " + socket.id);
					fn();
				});

				//get command from remote client to play a specific trailer
				socket.on("playSpecifTrailer", function(cubeLocation, trailerInternalName, trailerType, fn) {
					writeLog("Remote Client from " + cubeLocation + "wants to play: " + trailerInternalName);
					for (v = 0; v < locationsData.locations.length; v++) {
						if (locationsData.locations[v].locationName == cubeLocation) {
							if (socket.id == locationsData.locations[v].remoteClient.id) {
								locationsData.locations[v].videoClient.emit("playSpecifTrailer", trailerInternalName, trailerType);
								fn("success");
							} else {
								fn("fail");
							}
						}
					}
				});

				//get command from remote client to play a specific trailer
				socket.on("remoteStop", function() {
					writeLog("Remote Client wants to stop");
					videoClient.emit("stopTrailer");

				});

				//get command from remote client for a filtering query
				socket.on("queryDB", function(myCubeLocation, filteringQuery, fn) {

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
							cubeLocation: myCubeLocation
						}]
					}, function(err, queryResult) {
						if (err || !users) {
							writeLog("DB ERROR: ");
						} else {
							writeLog(queryResult.length + " Movies found in DB");
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
									writeLog("New playlist for " + cubeLocation + " successfully updated at Server");
								}
							}
							saveNewPlayListToDB(cubeLocation);

							if (undefined === myVideoClient || null === myVideoClient) {} else {
								myVideoClient.emit("updatePlaylist", function() {
									writeLog("New playlist " + cubeLocation + "successfully sent to video client");
								});
							}
							fn(true);
						}
					});
				});

				//admin changed the playlist and wants to update the local file and the video client 
				socket.on("addLocation", function(cubeLocation, fn) {
					fs.readFile(__dirname + "/public/data/config.json", "utf8", function(err, data) {
						data = JSON.parse(data);
						data.cubeLocations.push(cubeLocation);
						//update the config file
						fs.writeFile(__dirname + "/public/data/config.json", JSON.stringify(data), "utf8", function(err) {
							//load the template file for the new movie
							fs.readFile(__dirname + "/public/data/template.json", "utf8", function(err, data) {
								//make a new JSON file to store the movies
								fs.writeFile(__dirname + "/public/data/" + cubeLocation + ".json", data, "utf8", function(err) {
									if (err) console.log(err);
									writeLog("Config File successfully updated");
									fn("success");
								});
							});
						});
					});
				});

				//admin page wants to connect to the server
				socket.on("registerAdmin", function(fn) {
					writeLog("ADMIN connected with ID: " + socket.id);
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
					writeLog("VIDEO Client from location " + locationOfCubeToRegister + " registered with ID: " + socket.id);

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

//save new tracking message to file
function saveTrackingMessage(userID, locationName, eventType, message) {
	fs.readFile(__dirname + "/public/data/log.csv", "utf8", function(err, data) {
		data = data + userID + ";" + locationName + ";" + eventType + ";" + message;
		fs.writeFile(__dirname + "/public/data/log.csv", data, "utf8", function(err) {
			console.log("Tracking messages written");

		});
	});
}

//logging with timestap
function writeLog(message) {
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
	console.log(day + "." + month + "." + year + " " + hours + ":" + minutes + ":" + seconds + ": " + message);

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

module.exports = app;