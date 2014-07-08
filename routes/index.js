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
	//console.log("evoCube Location: " + req.param("location"));
	//console.log("Interaction type: " + req.param("type"));

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
					maxAge: 999999999
				});
			}
			console.log("User with ID " + newID + " connected");
			res.cookie('asdf', 'qwer', {
					maxAge: 600000
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

	console.log("Cookie: " + req.cookies.test2);
	if (undefined === req.cookies.test2) {
		console.log("HERE");
		res.cookie('test2', 'bb', {
			maxAge: 60000
		});
	}

	res.render('evoAdmin', {
		title: "evoAdmin"
	});

});

router.get('/questionnaire', function(req, res) {
	console.log("Cookie: " + req.cookies.test2);
	if (undefined === req.cookies.test2) {
		res.cookie('test2', 'bb', {
			maxAge: 100000
		});
	}
	res.render('questionnaire', {
		title: 'Fragebogen'
	});
});

router.get('/random', function(req, res) {
	console.log("Cookie: " + req.cookies.test2);
	res.render('random', {
		title: 'Zufall'
	});
});


module.exports = router;