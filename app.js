var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var io = require('socket.io');

var routes = require('./routes/index');
var users = require('./routes/users');



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);


var ua = require('universal-analytics');
var visitor = ua('UA-52372095-1').debug();


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
	console.log('Express server listening on port ' + server.address().port);

	
	var sockets = io.listen(server);
	console.log('Socket.io server listening on port ' + server.address().port);


	sockets.on("connection", function(socket){
		
		console.log("Connection " + socket.id + " accepted");
		visitor.event("Connection Accepted", "Connection", "nice", 42).send();
		
		socket.on("vote", function(vote){
				
		});
		
		socket.on("disconnect", function(){
				console.log("Connection " + socket.id + " terminated");
		});

		socket.on("remote_playPause", function(){
				visitor.event("RemoteEvent", "Play/Pause", "nice", 42).send();
				console.log("Remote Play/Pause received");
				sockets.emit("playPause");
				
		});

		socket.on("remoteVolumeChange", function(newVolume){
				console.log("Remote VolumeChange received: " + newVolume);
				sockets.emit("volumeChange", newVolume);
				
		});

		
		socket.on("ticker", function(fn){
			
		});


	});
	

});

module.exports = app;
