var express = require('express');
var router = express.Router();
var ua = require('universal-analytics');
var visitor = ua('UA-52372095-1').debug();

/* GET home page. */
router.get('/', function(req, res) {
	visitor.pageview("/index").send();
	visitor.event("Event Category", "Event Action", "index", 42).send();
	res.render('index', {
		title: 'Express'
	});
});

router.get('/remote', function(req, res) {
	visitor.pageview("/remote").send();
	visitor.event("Event Category", "Event Action", "index", 42).send();
	res.render('remote', {
		title: 'Remote'
	});
});


module.exports = router;