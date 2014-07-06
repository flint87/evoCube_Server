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
var collections = ["movies"];
var db = require("mongojs").connect(dburl, collections);


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

var playList;
var adminClient;

var server = app.listen(app.get('port'), function() {
	writeLog('Express server listening on port ' + server.address().port);


	var sockets = io.listen(server);
	writeLog('Socket.io server listening on port ' + server.address().port + "\n");
	var videoClient; //holds the socket ID of the newest video client
	var remoteClient = null; //holds the socket ID of the newest remote client

	var secretCode = "xxx";

	//read playlist from file into memory
	fs.readFile(__dirname + "/public/data/movies.json", "utf8", function(err, data) {
		if (err) {
			return console.log(err);
		}
		data = JSON.parse(data);
		playList = data;

		db.movies.drop();
		for (var v = 0; v < playList.length; v++) {
			db.movies.save(playList[v]);

		}

	});

	setInterval(function() {
		try {
			writeLog("Remote Client at the moment: " + remoteClient.id);
		} catch (err) {
			writeLog("No remote client at the moment");
		}

	}, 60000);

	sockets.on("connection", function(socket) {

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
		socket.on("dismissRemoteClient", function(fn) {
			remoteClient = null;
			fn();
		});

		//client wants control over the monitor
		//check with video client if a trailer is played at the moment
		//if remote connection is ok generate a random code for authentification
		socket.on("giveMeControl", function(fn) {
			videoClient.emit("isTrailerRunning", function(message) {
				writeLog("Trailer is running: " + message);
				if (message) {
					fn(true);

				} else {
					fn(false);
					secretCode = Math.floor((Math.random() * 900) + 100);
					videoClient.emit("setSecret", secretCode);
					writeLog("Secret Code is now: " + secretCode);
				}
			});
		});

		//remote client wants to check if the submited secret code is correct
		socket.on("checkMyCode", function(submitedCode, fn) {
			writeLog("submitted code: " + submitedCode + " - correct code: " + secretCode);
			if (submitedCode == secretCode) {
				fn(true);
				videoClient.emit("hideCode");
				writeLog("HIDE CODE SENT");
				if (remoteClient) {
					remoteClient.emit("byebyeRemote");
				}
				remoteClient = socket;
				writeLog("New Client is remote client with ID: " + remoteClient.id);
			} else {
				fn(false);
			}
		});


		//the calling clients check regulary if they have control about the monitor or not
		socket.on("inCharge", function(fn) {
			try {
				if (socket.id == remoteClient.id) {
					fn(true);
				} else {
					fn(false);
				}
			} catch (err) {
				fn(false);
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
		socket.on("clientRegister", function(fn) {
			writeLog("Client registered to Server with ID: " + socket.id);
			fn();
			//socket.emit("sendPlayList");
		});

		//get command from remote client to play a specific trailer
		socket.on("playSpecifTrailer", function(trailerInternalName, trailerType, fn) {
			writeLog("Remote Client wants to play: " + trailerInternalName);
			if (socket.id == remoteClient.id) {
				videoClient.emit("playSpecifTrailer", trailerInternalName, trailerType);
				fn("success");
			} else {
				fn("fail");
			}
		});

		//get command from remote client to play a specific trailer
		socket.on("remoteStop", function() {
			writeLog("Remote Client wants to stop");
			videoClient.emit("stopTrailer");

		});

		//get command from remote client for a filtering query
		socket.on("queryDB", function(filteringQuery, fn) {
			writeLog("Test query received: " + filteringQuery);
			console.dir(filteringQuery);

			db.movies.find({
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
		socket.on("forcePlaylistUpdate", function(newPlaylist, fn) {

			fs.writeFile(__dirname + "/public/data/movies.json", newPlaylist, function(err) {
				if (err) {
					fn(false);
					console.log(err);
				} else {
					data = JSON.stringify(newPlaylist);
					playList = data;
					db.movies.drop();
					for (var v = 0; v < playList.length; v++) {
						db.movies.save(playList[v]);

					}
					videoClient.emit("updatePlaylist", function() {
						writeLog("Playlist successfully updated at video client");

					});
					fn(true);
				}
			});
		});

		//admin page wants to connect to the server
		socket.on("registerAdmin", function(fn) {
			writeLog("Admin connected with ID: " + socket.id);
			adminClient = socket;
			fn(true);

		});

		//##############################
		//MESSAGES FROM VIDEO CLIENT
		//#############################

		//register the newest video client to server
		socket.on("videoClientregister", function(fn) {
			videoClient = socket;
			writeLog("Video Client registered with ID: " + videoClient.id);
			for (var i = 0; i < playList.length; i++) {
				//writeLog("MovieName: " + playList[i].interalName);
			}
			fn(playList);
		});

	});
});

//logging with timestap
function writeLog(message) {
	console.log(new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " " + message);
	//console.log(new Date().getDay() + "." + new Date().getMonth() + "." + new Date().getYear() + " " + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " " + message);
}

module.exports = app;