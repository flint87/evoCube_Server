var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var io = require('socket.io');

var routes = require('./routes/index');
var users = require('./routes/users');



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


var ua = require('universal-analytics');
var visitor = ua('UA-52372095-1');
//var visitor = ua('UA-52372095-1').debug();



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

var server = app.listen(app.get('port'), function() {
	writeLog('Express server listening on port ' + server.address().port);


	var sockets = io.listen(server);
	writeLog('Socket.io server listening on port ' + server.address().port + "\n");
	var videoClient; //holds the socket ID of the newest video client
	var remoteClient = null; //holds the socket ID of the newest remote client
	var playList;

	setInterval(function() {
		try {
			writeLog("Remote Client at the moment: " + remoteClient.id);
		} catch (err) {
			writeLog("No remote client at the moment");
		}

	}, 10000);

	sockets.on("connection", function(socket) {

		writeLog("Connection " + socket.id + " accepted");
		visitor.event("Connection Accepted", "Connection", "nice", 42).send();


		socket.on("disconnect", function() {
			writeLog("Connection " + socket.id + " terminated");
			try {
				if (socket.id == remoteClient.id) {
					remoteClient = null;
					writeLog("Remote CLient unregister: " + socket.id);
				}
			} catch (err) {}

		});



		//##############################
		//MESSAGES FROM REMOTE CLIENT
		//#############################


		//the calling clients check regulary if they have control about the monitor or not
		socket.on("inCharge", function(fn) {
			try {
				if (socket.id == remoteClient.id) {
					fn("yes");
				} else {
					fn("no");
				}
			} catch (err) {
				fn("no");
			}
		});

		socket.on("remote_playPause", function() {
			visitor.event("RemoteEvent", "Play/Pause", "nice", 42).send();
			writeLog("Remote Play/Pause received");
			videoClient.emit("playPause");

		});

		socket.on("remoteVolumeChange", function(newVolume) {
			writeLog("Remote VolumeChange received: " + newVolume);
			videoClient.emit("volumeChange", newVolume);
		});

		//register the newest remote client to server
		socket.on("remoteClientregister", function(fn) {
			remoteClient = socket;
			writeLog("Remote Client registered with ID: " + remoteClient.id);
			fn();
			remoteClient.emit("sendPlayList", playList);

		});

		//get command from remote client to play a specific trailer
		socket.on("playSpecifTrailer", function(trailerInternalName, fn) {
			writeLog("Remote Client wants to play: " + trailerInternalName);
			if (socket.id == remoteClient.id) {
				videoClient.emit("playSpecifTrailer", trailerInternalName);
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



		//##############################
		//MESSAGES FROM VIDEO CLIENT
		//#############################

		//register the newest video client to server
		socket.on("videoClientregister", function(fn) {
			videoClient = socket;
			writeLog("Video Client registered with ID: " + videoClient.id);
			fn();
		});

		//receive the available playlist from the video client
		socket.on("registerPlayList", function(newPlaylist, fn) {
			writeLog("Playlist received");
			playList = newPlaylist;
			/*for (var i = 0; i < newPlaylist.length; i++) {
				writeLog(newPlaylist[i].movieName);
			}*/
			fn();
		});

	});

});

//logging with timestap
function writeLog(message) {
	console.log(new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " " + message);
}

module.exports = app;