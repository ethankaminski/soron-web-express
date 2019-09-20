// currently, this is a dead-simple file based storage engine

const fs = require('fs');

class Thing {
	constructor(name) {
		this.name = name
		this.file =`${engine.dir}/${name}.dat`
	}
	
	save(obj, cb) {
		fs.appendFile(this.file, JSON.stringify(obj) + "\n", cb)
	}

	find(obj, cb) {
		fs.readFile(this.file, function(err, stream) {
			if (err) {
				console.error(`No file ${this.file}`)
				return cb([])
			}
			var lines = stream.toString().split("\n").filter(x => x).map(r => JSON.parse(r));
			cb(lines.filter(r => {
				for (var key in obj) {
					if (r[key] !== obj[key]) {
						return false;
					}
				}
				return true;
			}))
		})
	}
}

const engine = {
	add: function(name) {
		this[name] = new Thing(name)
	},
	dir: 'local/storage',
}


module.exports = engine;
