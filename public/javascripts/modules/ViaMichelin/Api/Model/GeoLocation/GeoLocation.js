define([],
	function () {

		var core = function (value) {
			this.value = value;
		};

		core.prototype = {
			init : function (options) {

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