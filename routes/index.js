var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index', {
		title: 'Express'
	});
});

router.get('/remote', function(req, res) {
	res.render('remote', {
		title: 'Remote'
	});
});


module.exports = router;