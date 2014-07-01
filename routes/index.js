var express = require('express');
var router = express.Router();
var ua = require('universal-analytics');
//var visitor = ua('UA-52372095-1').debug();
var visitor = ua('UA-52372095-1');

/* GET home page. */
router.get('/', function(req, res) {
	visitor.pageview("/index").send();
	visitor.event("Page", "Call", "index").send();
	console.log("Cookie: " + req.cookies.test2);
	res.render('index', {
		title: 'Express'
	});
});

router.get('/remote', function(req, res) {
	visitor.pageview("/remote").send();
	console.log("Cookie: " + req.cookies.test2);
	if(undefined === req.cookies.test2 ){
		console.log("HERE");
		res.cookie('test2', 'bb', { maxAge: 100000});

	}
	visitor.event("Page", "Call", "remote").send();
	res.render('remote', {
		title: 'Remote'
	});
});

router.get('/questionnaire', function(req, res) {
	visitor.event("Page", "Call", "questionnaire").send();
	console.log("Cookie: " + req.cookies.test2);
	res.render('questionnaire', {
		title: 'Fragebogen'
	});
});


module.exports = router;