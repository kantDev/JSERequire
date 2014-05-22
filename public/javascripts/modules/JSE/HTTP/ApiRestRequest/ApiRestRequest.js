define([],
	function () {
		console.log("<> execution ApiRestRequest args: ", arguments);
		var core = function (value) {
			console.log("ApiRestRequest#Core");
			this.value = value;
		};

		core.prototype = {
			init : function (options) {
				console.log("ApiRestRequest#init");
			},
			request : function (options) {
				return this.value;
			},
			_request : function () {
				var fake = { coords : { lat : 2, lng : 3 }};
				return this._response(fake)
			},
			_response : function (value) {

			}
		};

		return core;
	}
);