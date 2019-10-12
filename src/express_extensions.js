function extend(app) {
	app.defaultMiddleware = []
	function AppProxyHandler(defaultList) {
		this.defaultMiddleware = defaultList;
	}
	AppProxyHandler.prototype.get = function(target, propName) {
		if (propName == 'without') {
			const without = (omit) => {
				return new Proxy(target, new AppProxyHandler(this.defaultMiddleware.filter(x => x.name != omit)))
			}
			return without;
		} else if (propName == 'defaultMiddleware') {
			return this.defaultMiddleware;
		}
		return target[propName]
	}
	app = new Proxy(app, new AppProxyHandler([]))

	app.get = new Proxy(app.get, {
		apply: function(target, thisArg, args) {
			// .get() is overloaded between "HTTP GET" and "get a variable"
			if (args.length < 2) {
				return target.apply(thisArg, args);
			}
			var last = args[args.length-1];
			if (typeof last == 'function' && last.length == 2) {
				args[args.length-1] = function(req, res, next) {
					var end = res.end;
					res.end = function(...args) {
						end.apply(res, args);
						next();
					}

					last(req, res);
				}
			}

			// in the 2-arg form, there won't be a route-specific middleware layer, and we DO want that
			if (args.length == 2) {
				args.splice(1,0,[]);
			}

			var middle = args[1].slice();
			middle.push(...thisArg.defaultMiddleware);
			args[1] = middle;

			console.log(`GET: ${args[0]}`)
			return target.apply(thisArg, args);
		}
	})

	return app;
}

module.exports = {
	extend,
}
