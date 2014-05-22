define(["JSE.HTTP.ApiRestRequest"],
	function (Rest) {
		console.log("<> execution Geocoding ", arguments, ", this: ", this);
		var core = function (value) {
			console.log("Geocoding#core ", value);
			this.value = value;
		};

		core.prototype = {
			init : function () {
				console.log("Geocoding#init: ", this);
				var r = new Rest();
				r.init();
			},
			request : function (options) {
				return this.value;
			},
			_request : function () {
				var fake = { coords : { lat : 2, lng : 3 }};
				return this._response(fake)
			},
			_response : function (value) {
				var geo = new geo(value);
			}
		};

		return core;
	}
);

/*define(
 [
 "JSE.HTTP.ApiRestRequest",
 "ViaMichelin.Api.Model.GeoLocation",
 "ViaMichelin.Api.Model.GeoCoordinates",
 "ViaMichelin.Api.Util.Country",
 "ViaMichelin.Api.Geocoding.GeocodingRequest",
 "ViaMichelin.Api.Exception",
 "ViaMichelin.Api.Constants.Exception"
 ],
 function (request, geoLocation, GeoCoordinates, country, GeocodingRequest, exception, cException) {

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
 		var geo = new geoLocation(value);
 	}
 };

 return core;
 }
 );*/