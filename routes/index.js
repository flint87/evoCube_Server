var express = require('express');
var router = express.Router();

var ua = require('universal-analytics');
var visitor = ua('UA-52372095-1').debug();
/* GET home page. */
router.get('/', function(req, res) {
	res.render('index', {
		title: 'Express'
	});
});

router.get('/remote', function(req, res) {
	visitor.pageview("/remote").send();
	res.render('remote', {
		title: 'Remote'
	});
});


module.exports = router;