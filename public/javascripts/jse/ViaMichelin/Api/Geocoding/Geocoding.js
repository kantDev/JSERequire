JSEPackage("ViaMichelin.Api.Geocoding");

JSEImportApi("JSE.HTTP.ApiRestRequest");
JSEImportApi("ViaMichelin.Api.Model.GeoLocation");
JSEImportApi("ViaMichelin.Api.Model.GeoCoordinates");
JSEImportApi("ViaMichelin.Api.Util.Country");
JSEImportApi("ViaMichelin.Api.Geocoding.GeocodingRequest");
JSEImportApi("ViaMichelin.Api.Exception");
JSEImportApi("ViaMichelin.Api.Constants.Exception");

/* Required Libraries */
JSEImportApi("JSE.HTTP.AsyncJSHTTPRequest");
JSEImportApi("JSE.HTML.UIComponent");
/* Required Libraries */

/**
 * @description
 * Permet le Géocodage d'adresse ainsi que le reverse géocodage (à partir de longitude et latitude)
 *
 * @example
 * Géocodage d'une localisation (long/lat) :
 *
 * var conf = {
 *    "coords" : { "lon" : "45.1", "lat": "3.3" },
 * }, geocoding = null;
 *
 * var callback = {
 *    "onInit" : function(app) {
 *       geocoding = app;
 *    }
 * }
 *
 * JSELaunch("ViaMichelin.Api.Geocoding", conf; callback, ViaMichelin.Api.Constants.System.ApiJSEPath);
 *
 * @constructor
 * @class ViaMichelin.Api.Geocoding
 */
ViaMichelin.Api.Geocoding = function () {
	this.prepare();
};

ViaMichelin.Api.Geocoding.prototype = {
	JSEwireHub: {
		"onSuccess": [],
		"onError": []
	},
	apiRestRequest: {
		JSEtype: "JSE.HTTP.ApiRestRequest",
		JSEwires: [
			{
				event: "responseLoaded",
				method: "JSEInstance._callback",
				thisObj: "JSEInstance"
			},
			{
				event: "responseCancelled",
				method: "JSEInstance._error",
				thisObj: "JSEInstance"
			},
			{
				event: "responseError",
				method: "JSEInstance._error",
				thisObj: "JSEInstance"
			}
		]
	},
	_requests: null,
	_results: null,
	//APIREST10
	_serviceVersion: 1,
	_showHT: null,
	_filterHTLang: null,

	/**
	 * Initialize
	 * @ignore
	 */
	init: function (conf) {
		this._search(conf);
	},

	release: function () {
		this._requests = null;
		this._results = null;
		this.apiRestRequest.isolate();
		this.apiRestRequest.release();

		delete this.apiRestRequest;
		delete this._requests;
		delete this._results;
	},
	/**
	 * Lance la recherche
	 * @name search
	 * @function
	 * @memberOf ViaMichelin.Api.Geocoding#
	 * @param {Object} request
	 */
	_search: function (request) {
		if (this._requests != null) {
			return false;
		}
		if (request instanceof Array) {
			this._requests = request.slice(0, request.length);
			this._results = [];
		} else {
			this._requests = [request];
			this._results = null;
		}

		/* Preparation des données */
		for (var i = 0; i < this._requests.length; i++) {
			if (this._requests[i].coords) {
				// Locations by coords
				ToJSEObject(this._requests[i].coords);
				this._requests[i].coords = this._requests[i].coords.cast("ViaMichelin.Api.Model.GeoCoordinates");
			} else if (this._requests[i].address || this._requests[i].countryISOCode ||
				this._requests[i].countryVMCode ||
				this._requests[i].cityZip || this._requests[i].zip ||
				this._requests[i].city ||
				this._requests[i].singleFieldSearch) {
				// Locations by GeocodingRequest
				ToJSEObject(this._requests[i]);
				this._requests[i] = this._requests[i].cast("ViaMichelin.Api.Geocoding.GeocodingRequest");
			} else if (this._requests[i].id) {
				// Locations by reflexId
				/* There is no class for reflex id. */
			} else {
				// Unknown
				throw new ViaMichelin.Api.Exception(
					ViaMichelin.Api.Constants.Exception.INVALID_PARAMETER, "Unknown request type : " + this._requests[i]
				);
			}
		}
		/* Launch */
		this._doRequest();
		return true;
	},
	/**
	 * Recherche à partir d'une addresse
	 * @param {Object} oGeoLocation
	 */
	_searchForLocationsByGeocodingRequest: function (oGeoLocation) {
		if (!oGeoLocation.countryVMCode) {
			if (oGeoLocation.countryISOCode) {
				oGeoLocation.countryVMCode = ViaMichelin.Api.Util.Country.getCountryCodeFromISOCode(oGeoLocation.countryISOCode);
			}
		}
		var params = "";
		var type = "geocode3f.json";

		if (oGeoLocation.address) {
			params += "&ad" + "dress=" + encodeURIComponent(oGeoLocation.address);
		}
		if (oGeoLocation.countryISOCode) {
			params += "&coun" + "try=" + oGeoLocation.countryISOCode;
		}

		if (oGeoLocation.cityZip) {
			params += "&cityzip=" + encodeURIComponent(oGeoLocation.cityZip);
		} else {
			type = "geocode4f.json";
			if (oGeoLocation.zip) {
				params += "&zip=" + oGeoLocation.zip;
			}
			if (oGeoLocation.city) {
				params += "&city=" + encodeURIComponent(oGeoLocation.city);
			}
		}
		//Recherche champ unique
		if (oGeoLocation.singleFieldSearch) {
			type = "geocode1f.json";
			params = "&qu" + "ery=" + oGeoLocation.singleFieldSearch;
			if (oGeoLocation.countryISOCode) {
				params += "&coun" + "try=" + oGeoLocation.countryISOCode;
			}
		}

		if ($isNotEmpty(oGeoLocation.favoriteCountry)) {
			params += "&favc=" + oGeoLocation.favoriteCountry;
		}
		//APIREST10
		params += this._getHTParams();
		this.apiRestRequest.request(type, params, this._serviceVersion);
	},
	/**
	 * Recherche à partir d'un reflexId
	 * @param {String} id
	 */
	_searchForLocationsByReflexId: function (id) {
		var params = "";
		var type = "location.json/" + id;
		//APIREST10
		params += this._getHTParams();
		this.apiRestRequest.request(type, params, this._serviceVersion);
	},
	/**
	 * Recherche à partir de coordonnées géographiques
	 * @param {Object} oGeoCoords
	 */
	_searchForLocationsByCoords: function (oGeoCoords) {
		var params = "center=" + oGeoCoords.lon + ":" + oGeoCoords.lat;
		//APIREST10
		params += this._getHTParams();
		this.apiRestRequest.request("rgeocode.json", params, this._serviceVersion);
	},
	_doRequest: function () {
		var request = this._requests.shift();
		//APIREST10
		if (request.serviceVersion) {
			this._serviceVersion = request.serviceVersion;
		}
		if ('showHT' in request) {
			this._showHT = request.showHT;
		}
		if ('filterHTLang' in request) {
			this._filterHTLang = request.filterHTLang;
		}
		if (request.coords != null) {
			this._searchForLocationsByCoords(request.coords);
		} else if (request.id != null) {
			this._searchForLocationsByReflexId(request.id);
		} else {
			this._searchForLocationsByGeocodingRequest(request);
		}
	},

	/**
	 * Builds Hierarchy params
	 * @returns {string}
	 * @private
	 */
	_getHTParams: function () {
		var params = "";
		if (this._serviceVersion === 10) {
			if (this._showHT) {
				params += "&showHT=true";
				if (this._filterHTLang) {
					params += "&filterHTLang=true";
				}
			}
		}
		return params;
	},

	/**
	 * Analyse le JSON de retour
	 * @param {Object} response
	 * @return {Array}
	 */
	_callback: function (response) {
		console.log("_callback :", response);
		var results = [];
		if (response.size > 0) {
			/* Analyse du JSON et Cast */
			//APIREST10
			//var locationsField = (this._serviceVersion == 10) ? "locations" : "locationList";
			var locationsField = "locationList";
			for (var i = 0; i < response[locationsField].length; i++) {
				var item = response[locationsField][i];
				if (item.location != null) {
					var geo = item.location;

					// create ambiguityLine
					//if (geo.formattedAddressLine!="") {}

					geo.ambiguityLine = "- " + geo.countryOfficial + " - " + geo.area;

					if ($isNotEmpty(geo.formattedAddressLine)) {
						geo.ambiguityLine += " - ";
					}
					else {
						geo.ambiguityLine += " : ";
					}

					if ($isNotEmpty(geo.postalCode)) {
						geo.ambiguityLine += geo.city;
						geo.ambiguityLine += " (" + geo.postalCode + ")";
					} else {
						geo.ambiguityLine += geo.formattedCityLine;
					}

					if ($isNotEmpty(geo.formattedAddressLine)) {
						geo.ambiguityLine += " : " + geo.formattedAddressLine;
					}

					geo.jalon = geo.significance;
					geo.coherenceDegree = item.coherenceDegree;
					ToJSEObject(geo);
					results.push(geo.cast("ViaMichelin.Api.Model.GeoLocation"));
				}
			}
		}

		if (this._results == null) {
			/* Un element a géocoder en entrée */
			this._results = results;
		} else {
			/* Tableau de données à géocoder en entrée */
			this._results.push(results);
		}

		if (this._requests == null || this._requests.length === 0) {
			this._requests = null;
			this.stimulate("onSuccess", this._results);
			this.release();
			this.isolate();
		} else {
			this._doRequest();
		}
	},
	_error: function (response) {
		this.stimulate("onError", response);
		this.release();
		this.isolate();
	},
	toString: function () {
		return "[ViaMichelin.Api.Geocoding]";
	}
};