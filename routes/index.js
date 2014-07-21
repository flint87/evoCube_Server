var express = require('express');
var router = express.Router();
var fs = require('fs');
var allowedLocations = [];
var path = require('path');
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');



//get config file to determine which connections are allowed and which not
fs.readFile(path.dirname(require.main.filename) + "/public/data/config.json", "utf8", function(err, data) {
	if (err) {
		return console.log(err);
	}
	data = JSON.parse(data);
	for (var v = 0; v < data.cubeLocations.length; v++) {
		allowedLocations.push(data.cubeLocations[v]);
	}
});

router.get('/remote', function(req, res) {
	//check if there is an allowed request parameter for location
	var newID = intformat(flakeIdGen.next(), 'dec');
	var connectionAllowed = false;
	for (var v = 0; v < allowedLocations.length; v++) {
		if (req.param("location") == allowedLocations[v])
			connectionAllowed = true;
	}
	//mydbConnection.movies.drop();
	if (connectionAllowed) {
		//check if there is an allowed request parameter for type
		if (req.param("type") == "nfc" || req.param("type") == "qr") {
			if (undefined === req.cookies.userID) {
				res.cookie('userID', newID, {
					maxAge: 999999999999
				});
				saveTrackingMessage(newID, req.param("location"), "PageCall", "remote", req.param("type"), JSON.stringify(req.headers['user-agent']));
			} else {
				saveTrackingMessage(req.cookies.userID, req.param("location"), "PageCall", "remote", req.param("type"), JSON.stringify(req.headers['user-agent']));
			}
			res.cookie('remoteVisited', "true", {
				maxAge: 999999999999
			});
			res.render('remote', {
				title: 'Movie Cube'
			});
		} else {
			res.render('falseURLError', {
				title: "Fehler",
				message: "Du musst die Seite über den evoCube aufrufen"
			});
		}
	} else {
		res.render('falseURLError', {
			title: "Fehler",
			message: "Du musst die Seite über den evoCube aufrufen"
		});
	}
});

router.get('/evoAdmin', function(req, res) {
	res.render('evoAdmin', {
		title: "evoAdmin"
	});
});

router.get('/questionnaire', function(req, res) {
	//check if there is an allowed request parameter for location
	var newID = intformat(flakeIdGen.next(), 'dec');
	var connectionAllowed = false;
	for (var v = 0; v < allowedLocations.length; v++) {
		if (req.param("location") == allowedLocations[v])
			connectionAllowed = true;
	}
	//mydbConnection.movies.drop();
	if (connectionAllowed) {
		//check if there is an allowed request parameter for type
		if (req.param("type") == "nfc" || req.param("type") == "qr") {
			if (undefined === req.cookies.userID) {
				res.cookie('userID', newID, {
					maxAge: 999999999999
				});
				saveTrackingMessage(newID, req.param("location"), "PageCall", "questionnaire", req.param("type"), JSON.stringify(req.headers['user-agent']));
			} else {
				saveTrackingMessage(req.cookies.userID, req.param("location"), "PageCall", "questionnaire", req.param("type"), JSON.stringify(req.headers['user-agent']));
			}
			res.render('questionnaire', {
				title: 'Feedback'
			});
		} else {
			res.render('falseURLError', {
				title: "Fehler",
				message: "Du musst die Seite über den evoCube aufrufen"
			});
		}
	} else {
		res.render('falseURLError', {
			title: "Fehler",
			message: "Du musst die Seite über den evoCube aufrufen"
		});
	}
});

router.get('/random', function(req, res) {
	//check if there is an allowed request parameter for location
	var newID = intformat(flakeIdGen.next(), 'dec');
	var connectionAllowed = false;
	for (var v = 0; v < allowedLocations.length; v++) {
		if (req.param("location") == allowedLocations[v])
			connectionAllowed = true;
	}
	//mydbConnection.movies.drop();
	if (connectionAllowed) {
		//check if there is an allowed request parameter for type
		if (req.param("type") == "nfc" || req.param("type") == "qr") {
			if (undefined === req.cookies.userID) {
				res.cookie('userID', newID, {
					maxAge: 999999999999
				});
				saveTrackingMessage(newID, req.param("location"), "PageCall", "random", req.param("type"), JSON.stringify(req.headers['user-agent']));
			} else {
				saveTrackingMessage(req.cookies.userID, req.param("location"), "PageCall", "random", req.param("type"), JSON.stringify(req.headers['user-agent']));
			}
			res.cookie('randomVisited', "true", {
				maxAge: 999999999999
			});
			res.render('random', {
				title: 'Movie Cube'
			});
		} else {
			res.render('falseURLError', {
				title: "Fehler",
				message: "Du musst die Seite über den evoCube aufrufen"
			});
		}
	} else {
		res.render('falseURLError', {
			title: "Fehler",
			message: "Du musst die Seite über den evoCube aufrufen"
		});
	}
});

router.get('/fb', function(req, res) {

	var newID = intformat(flakeIdGen.next(), 'dec');
	var connectionAllowed = false;
	for (var v = 0; v < allowedLocations.length; v++) {
		if (req.param("location") == allowedLocations[v])
			connectionAllowed = true;
	}
	if (connectionAllowed) {
		//check if there is an allowed request parameter for type
		if (req.param("type") == "nfc" || req.param("type") == "qr") {
			if (undefined === req.cookies.userID) {
				res.cookie('userID', newID, {
					maxAge: 999999999999
				});
				saveTrackingMessage(newID, req.param("location"), "PageCall", "facebook", req.param("type"), JSON.stringify(req.headers['user-agent']));
			} else {
				saveTrackingMessage(req.cookies.userID, req.param("location"), "PageCall", "facebook", req.param("type"), JSON.stringify(req.headers['user-agent']));
			}

			res.render('fb', {
				title: 'Facebook'
			});
		} else {
			res.render('falseURLError', {
				title: "Fehler",
				message: "Du musst die Seite über den evoCube aufrufen"
			});
		}
	} else {
		res.render('falseURLError', {
			title: "Fehler",
			message: "Du musst die Seite über den evoCube aufrufen"
		});
	}

});

//save new tracking message to file
function saveTrackingMessage(userID, locationName, eventType, message, parameter, clientUserAgent) {
	var myTimeStamp = getTimeStamp();
	fs.readFile(path.dirname(require.main.filename) + "/evoCubeLog.csv", "utf8", function(err, data) {

		if (err) {
			console.log("Reading error");
			console.log(err);
		} else {
			data = data + myTimeStamp + ";" + userID + ";" + locationName + ";" + eventType + ";" + message + ";" + parameter + ";" + clientUserAgent + "\n";
			fs.writeFile(path.dirname(require.main.filename) + "/evoCubeLog.csv", data, "utf8", function(err) {
				if (err) {
					writeLog("File writting error at saving Log Entry to file", "error");
				} else {
					//console.log("Tracking messages written");
				}
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
	newEntry.clientUserAgent = clientUserAgent;

	mydbConnection.log.save(newEntry, function(error, savedEntry) {
		if (error) {
			writeLog("DB Error at saving Log Entry", "error");
		}

	});

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


module.exports = router;