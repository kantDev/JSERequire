var express = require('express');
var router = express.Router();
var jse = require('../public/javascripts/require');


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/test', function(req, res) {

	jse.require(["ViaMichelin.Api.Geocoding"], function (T) {
		console.log("t: ", T);

		var test = new T('Ceci est un test'), opt = {};
		console.log("=== test: ", test);
		test.init(opt);
		var response = test.request();

		console.log("=== response: ", response);

	});

	res.render('test', { title: 'Express' });
});


module.exports = router;
