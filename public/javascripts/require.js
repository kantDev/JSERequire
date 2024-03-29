(function () {
	var _package = {}, _loading = [],
		_modules = [], JSE;

	var Module = function (name, list) {
		console.log("> Module# create Module: ", arguments);
		L.Util.extend(this, L.Events);

		var _list = this.list = [], i;

		if (arguments.length === 0) {
			name = "";
			_list = [];
		} else if (arguments.length === 1) {
			if (Object.prototype.toString.call(name) === '[object Array]') {
				name = "";
				_list = name;
			} else {
				_list = [];
			}
		} else {
			_list = list;
		}

		if (Object.prototype.toString.call(_list) !== '[object Array]') {
			_list = [ _list ];
		}

		for (i = 0; i < _list.length; i++) {
			//console.log("--- ", i ," , ", _list[i]);
			this.list.push(new Module(_list[i], []));
		}

		this.name = name;
		console.log("> Initialisation Module '" + this.name + "' : ", this);
	};

	Module.prototype = {
		name : "",
		type : "define",
		list : null,
		loaded : false,
		cpt : 0,
		load : function () {
			//console.log("Module#load ("+this.name+"): ", this, " ,l: ", this.cpt + " <> " + this.list.length);

			if (this.cpt < this.list.length) {
				console.log("--- load next '" + this.list[this.cpt].name + "' ---");
				this.list[this.cpt].on("loaded", function () {
					console.log("- module " + this.list[this.cpt].name + " loaded");
					this.cpt++;
					this.load();
				}, this);

				if (typeof (window) !== "undefined") {
					this.list[this.cpt]._loadScript(this.list[this.cpt].name);
				} else {
					this.list[this.cpt]._loadNode(this.list[this.cpt].name);
				}
			} else {
				console.log("--- Modules '" + this.name + "' loaded ---");
				console.log("- cpt:" + this.cpt + "- --- ", this);
				var params = [];
				for (var j = 0; j < this.list.length; j++) {
					params.push(this.list[j].fct.apply(this));
				}

				if (this.type === "define") {
					console.log("--1-- ", params, this.name);
					var fct = this.fct;
					this.fct = fct.apply(this, params);
					/*this.fct = function(){
					 console.log("... ", arguments, "...");
					 return fct.apply(this, params);
					 }*/

				} else if (this.type === "require") {
					console.log("--2-- ", params);
					//this.fct.apply(this, params);

					// hack
					//this.list = [
					//	{ fct: obj },
					//	{ fct: req }
					//];
				}

				this.loaded = true;
				this.fire("loaded");
			}
		},

		_loadScript : function (name) {
			console.log(">>> loading ", name);
			var url = this.packageToUrl(name);
			var script = this.createScript(url);

			this.register();

			script.onload = function () {
				console.log("Module#script loaded !!");
			};

			script.onerror = function () {
				console.log("Module#script error !!");
			};

			document.head.appendChild(script);
		},

		_loadNode : function (name) {
			console.log(">>> loading ", name);

			require(this.convertModuleToPath(name));

		},

		convertModuleToPath : function (module) {
			var len = module.split(".").length,
				name = module.split(".")[len - 1] + ".js",
				path = module.replace(/\./g, "/") + "/" + name;
			return "./modules/" + path;
		},

		register : function () {
			//_modules.push({ name : this.name, loaded : false });
			console.log("Module#_modules: ", _modules);
		},
		packageToUrl : function (pack) {
			console.log("Module#- packageToUrl : ", arguments);
			var len = pack.split(".").length, name = pack.split(".")[len - 1] + ".js";
			return "/javascripts/modules/" + pack.replace(/\./g, "/") + "/" + name;
		},
		createScript : function (url, type) {
			var script = document.createElement("script");
			script.type = "text/javascript";
			script.src = url;
			return script;
		}
	};

	function _analysePackage(list, fct) {
		var i, packages = [];

		var master = new Module("master", list);
		master.type = "require";
		master.fct = fct;

		_modules.push(master);

		console.log("Master: ", master);
		master.on("loaded", function () {
			console.log("!!! Module '", master.name, "' loaded !!! ", fct);

			var params = [];
			for (var j = 0; j < master.list.length; j++) {
				params.push(master.list[j].fct);
			}

			fct.apply(master, params);
		}, this);

		master.load();
	}

	function _require(list, fct) {
		console.log("Require: ", list, ", fct: ", fct);
		_analysePackage(list, fct);
	}


	var Define = function (name, list, fct) {
		console.log("Define: ", name, list, fct);
		var module, i;
		this.list = [];

		for (i = 0; i < list.length; i++) {
			this.list.push(new Module(list[i]));
		}

		this.fct = fct;

		function foundCurrentModule(module) {
			var i;
			console.log("foundCurrentModule >>> ", module);

			if (!module.loaded && module.list && module.list.length === 0) {
				return module;
			} else if (module.list) {
				for (i = 0; i < module.list.length; i++) {
					var v = foundCurrentModule(module.list[i]);
					if (v) return v;
				}
			}
			return null;
		}

		// Recherche de la référence
		for (i = 0; i < _modules.length; i++) {
			var value = null;
			if (value = foundCurrentModule(_modules[0])) {
				module = value;
			}
		}
		module.name = name;
		module.type = "define";
		module.fct = fct;
		module.list = this.list;

		console.log("! module found ! ", module);

		if (module.list && module.list.length > 0) {
			module.load();
		} else {
			module.loaded = true;
			module.fire("loaded");
		}

		//console.log("Define :", _modules, " >>> ", this.modules);
	};

	Define.prototype = {
		modules : []
	};

	function _define(name, list, fct) {
		return new Define(name, list, fct);
	}

	JSE = {};
	JSE.require = _require;
	JSE.define = _define;

	if (typeof (window) !== "undefined") {
		window.JSE = {};
		window.JSE.require = _require;
		window.JSE.define = _define;
	} else {
		global.JSE = JSE;
		require('./Class');
		require('./Events');
		require('./Util');
		exports.require = JSE.require;
		exports.define = JSE.define;
	}
})();