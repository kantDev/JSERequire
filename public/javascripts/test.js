// Test
JSE.require(["ViaMichelin.Api.Geocoding"], function (T) {
	console.log("t: ", T);

	var test = new T('Ceci est un test'), opt = {};
	console.log("=== test: ", test);
	test.init(opt);
	var response = test.request();

	console.log("=== response: ", response);

});