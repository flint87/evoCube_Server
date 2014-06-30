var express = require('express');
var router = express.Router();
var ua = require('universal-analytics');
var visitor = ua('UA-52372095-1').debug();

/* GET home page. */
router.get('/', function(req, res) {
	visitor.pageview("/index").send();
	visitor.event("Page", "Call", "index").send();
	res.render('index', {
		title: 'Express'
	});
});

router.get('/remote', function(req, res) {
	visitor.pageview("/remote").send();
	visitor.event("Page", "Call", "remote").send();
	res.render('remote', {
		title: 'Remote'
	});
});

router.get('/questionnaire', function(req, res) {
	visitor.event("Page", "Call", "questionnaire").send();
	res.render('questionnaire', {
		title: 'Fragebogen'
	});
});


module.exports = router;