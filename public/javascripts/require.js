var obj = function (value) {
	this.value = value;
};
obj.prototype = {
	init : function (options) {
		console.log("O#init : ", options);
	},
	getValue : function () {
		console.log("O#getValue");
		return this.value;
	}
};

var req = function(){};
req.prototype = {
	request:function(){
		console.log("B#request");
	}
};

(function () {
	var _package = {}, _loading = [],
		_modules = [];

	var Module = function (name, list) {
		console.log("Module# create Module: ", arguments);
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
	};

	Module.prototype = {
		name : "",
		type : "define",
		list : [],
		loaded : false,
		cpt : 0,
		load : function () {
			//console.log("Module#load ("+this.name+"): ", this, " ,l: ", this.cpt + " <> " + this.list.length);

			if (this.cpt < this.list.length) {
				console.log("--- load next '"+ this.list[this.cpt].name +"' ---");
				this.list[this.cpt].on("loaded", function () {
					console.log("- module " + this.list[this.cpt].name + " loaded");
					this.cpt++;
					this.load();
				}, this);

				this.list[this.cpt]._load(this.list[this.cpt].name);
			} else {
				console.log("--- Modules '"+ this.name +"' loaded ---");
				console.log("- cpt:" + this.cpt + "- --- ", this);
				var params = [];
				for (var j = 0; j < this.list.length; j++) {
					params.push(this.list[j].fct);
				}

				if (this.type === "define") {
					console.log("--1-- ", params);
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

		_load : function (name) {
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
		master.obj = obj;

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

	window.require = _require;

	var Define = function (list, fct) {
		console.log("Define: ", list, fct);
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

	function _define(list, fct) {
		return new Define(list, fct);
	}

	window.define = _define;
})();