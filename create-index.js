const lunr = require("lunr");
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const crypto = require('crypto');
const fs = require('fs');

const channel = "nixos-20.09";

async function get_packages(channel) {
	const { stdout } = await exec(`nix-env -qa --json -f channel:${channel}`, {
		maxBuffer: 1024 * 1024 * 200
	});
	const data = await stdout;
	return JSON.parse(data);
}

async function get_options(channel) {
	const { stdout } = await exec(`nix-build '<nixpkgs/nixos/release.nix>' --no-out-link -A options -I nixpkgs=channel:${channel}`);
	const out_path = (await stdout).trim();

	return `${out_path}/share/doc/nixos/options.json`
}

function attributeByPath(obj, path, def) {
	return path.reduce((acc, key) => ( acc[key] || def), obj)
}

function toSearchIndexObject(attrname, obj) {
	const i = {
		attribute_name: attrname,
		name: obj.name,
//		license: attributeByPath(obj, ["meta", "license", "shortName"], "n/a")
	};

	if (obj.meta && obj.meta.longDescription)
		i.long_description = obj.meta.longDescription;

	if (obj.meta && obj.meta.license) {
		const l = obj.meta.license;
		if (l.shortName) {
			i.license = l.shortName;
		} else {
			i.license = l;
		}
	}
	return i;
}

get_options(channel).then(path => {
	const content = fs.readFileSync(path);
	const options = JSON.parse(content);
	const idx = lunr(function() {
		this.ref("path");
		this.field("path");
		this.field("spaced_path");
		this.field("description");

		Object.entries(options).forEach(e => {
			const key = e[0];
			const value = e[1];
			const object = {
				path: key,
				description: value.description,
				spaced_path: key.split("."),
			};
			this.add(object);
		}, this);
	});

	const x = fs.WriteStream(`options-${channel}.json`);
	x.write(JSON.stringify(idx));

	console.log(idx.search("tmpfile"));

	const packs = {};

	Object.entries(options).forEach(e => {
		const name = e[0];
		const obj = e[1];

		const path = name.split('.');
		const pack_path = path.slice(0, 2);
		const pack_key = pack_path.join('_');
		packs[pack_key] = packs[pack_key] || {};
		const pack = packs[pack_key];
		pack[name] = obj;
	});

	Object.entries(packs).forEach(e => {
		const pack_key = e[0];
		const objs = e[1];
		const w = fs.WriteStream(`options-${channel}-${pack_key}.json`);
		w.write(JSON.stringify(objs));
	});
})

get_packages(channel).then(data => {
	const objs = Object.entries(data).map(v => toSearchIndexObject(v[0], v[1]));
	const idx = lunr(function () {
		this.ref("attribute_name");
		this.field("attribute_name");
		this.field("name");
		//this.field("long_description");

		Object.values(objs).forEach((obj) => {
			const o = {
				attribute_name: obj.attribute_name,
				name: obj.name,
			};
			this.add(o);
		}, this);
	});

	const x = fs.WriteStream(`packages-${channel}.json`);
	x.write(JSON.stringify(idx));

	const packs = {};
	Object.values(objs).forEach(obj => {
		const key = obj.attribute_name;

		const pack_key = key.substring(0, 2).toLowerCase();
		packs[pack_key] = packs[pack_key] || {};
		const pack = packs[pack_key];
		pack[key] = obj;
	});

	Object.entries(packs).forEach(e => {
		const pack_key = e[0];
		const objs = e[1];
		const w = fs.WriteStream(`packages-${channel}-${pack_key}.json`);
		w.write(JSON.stringify(objs));
	});
});
