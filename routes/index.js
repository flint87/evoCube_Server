var express = require('express');
var router = express.Router();

router.get('/remote', function(req, res) {
	console.log("loc: " + req.param("loc"));
	console.log("type: " + req.param("type"));
	if (req.param("type") == "nfc" || req.param("type") == "qr") {
		console.log("Cookie: " + req.cookies.test2);
		if (undefined === req.cookies.test2) {
			console.log("HERE");
			res.cookie('test2', 'bb', {
				maxAge: 60000
			});
		}
		res.render('remote', {
			title: 'Movie Matcher'
		});
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