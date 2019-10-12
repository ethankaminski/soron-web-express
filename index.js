const express = require('express');
var app = express();

const session = require('express-session');

const fs = require('fs');

app.use(express.static("public"));

app.set('view engine', 'pug');

// using formidable instead of body-parser because it can handle file uploads
app.use(require('express-formidable')({multiples:true}));

app.use(function(req, res, next) {
	var pug = require('pug');

	res.locals.clips = [];
	res.addClip = function(viewname, clipname='') {
		if (!clipname) {
			clipname = viewname;
		}

		res.locals.clips.push({
			code: pug.compileFileClient(`./views/clips/${viewname}.pug`, {name:clipname}),
			name: clipname,
		})
	}

	next();
})

const storage = require('./src/storage.js')


app = require('./src/express_extensions.js').extend(app);


function use_session(secret_file, store=null) {
	var SECRETS = {
		session: fs.readFileSync(secret_file).toString().replace(/\s+/),
	}

	config = {
		key: 'some_session',
		secret: SECRETS.session,
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 14,
			saveUninitialized: false,
		},
	}

	if (store) {
		config.store = store;
	}

	app.use(session(config));

	app.use(function(req, res, next) {
		res.locals.me = {
			id: req.session.user_id,
			username: req.session.username,
		}

		res.locals.base_path = '/';
		next();
	});
}

function create_directories(dirs) {
	dirs.forEach(dir => fs.mkdirSync(dir, {recursive:true}));
}

function load_routes(dir) {
	var srcdir = `${dir}/src/routes`
	files = fs.readdirSync(srcdir).filter(fn => fn.match(/\.js$/))
	files.forEach(file => {
		mod = require(`${srcdir}/${file}`);
		if (mod.use) {
			mod.use(app);
		}
	})
}

module.exports = {
	app,
	storage,
	session,
	use_session,
	start: function(PORT, dir) {
		load_routes(dir);
		create_directories([
			storage.dir,
		])
		app.listen(PORT, function() {
			console.log('Listening on port ' + PORT);
		})
	},
	bcrypt: require('bcrypt'), // temporary
}
