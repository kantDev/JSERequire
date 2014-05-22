// Test
require(["ViaMichelin.Api.Geocoding"], function (T) {
	console.log("t: ", T);

	var test = new T('Ceci est un test'), opt = {};
	console.log("test: ", test);
	test.init(opt);

});