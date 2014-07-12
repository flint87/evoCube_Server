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
				saveTrackingMessage(newID, req.param("location"), "PageCall", "remote", req.param("type"));
			} else {
				saveTrackingMessage(req.cookies.userID, req.param("location"), "PageCall", "remote", req.param("type"));
			}
			res.cookie('remoteVisited', "true", {
					maxAge: 999999999999
				});
			res.render('remote', {
				title: 'Movie Matcher'
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
				saveTrackingMessage(newID, req.param("location"), "PageCall", "questionnaire", req.param("type"));
			} else {
				saveTrackingMessage(req.cookies.userID, req.param("location"), "PageCall", "questionnaire", req.param("type"));
			}
			res.render('questionnaire', {
				title: 'Fragebogen'
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
				saveTrackingMessage(newID, req.param("location"), "PageCall", "random", req.param("type"));
			} else {
				saveTrackingMessage(req.cookies.userID, req.param("location"), "PageCall", "random", req.param("type"));
			}
			res.cookie('randomVisited', "true", {
					maxAge: 999999999999
				});
			res.render('random', {
				title: 'Zufall'
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
function saveTrackingMessage(userID, locationName, eventType, message, parameter) {
	fs.readFile("C:/evoCubeLog.csv", "utf8", function(err, data) {
		if (err) {
			console.log("Reading error");
			console.log(err);
		} else {
			data = data + getTimeStamp() + ";" + userID + ";" + locationName + ";" + eventType + ";" + message + ";" + parameter + "\n";
			fs.writeFile("C:/evoCubeLog.csv", data, "utf8", function(err) {
				if (err) {
					console.log(err);
				} else {
					//console.log("Tracking messages written");
				}
			});
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


module.exports = router;