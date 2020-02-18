'use strict';

var locationsVarName = 'locationZone';
var fs = require('fs');
var jsdom = require('jsdom');
var csv = require('fast-csv');
var minify = require('html-minifier').minify;
var unzip = require('unzip');
var request = require('request');
const pagesFolder = './docs';
const citiesDataURL = 'http://download.geonames.org/export/dump/cities15000.zip';


var citiesHeader = ['geonameid', 'name', 'asciiname', 'alternatenames', 'latitude', 'longitude',
	'featureClass', 'featureCode', 'countryCode', 'cc2', 'admin1Code', 'admin2Code', 'admin3Code', 'admin4Code',
	'population', 'elevation', 'dem', 'timezone', 'modificationDate'
];
var countriesHeader = ['ISO', 'ISO3', 'ISO-Numeric', 'fips', 'Country', 'Capital',
	'Area', 'Population', 'Continent', 'tld', 'CurrencyCode', 'CurrencyName', 'Phone',
	'PostalCodeFormat', 'PostalCodeRegex', 'Languages', 'geonameid', 'neighbours', 'EquivalentFipsCode'
];

async function main() {

	await downloadCitiesZipAsync();
	await unzipCitiesAsync();

	cleanResultsFolder();
	copyFilesStartingWith('favicon');
	copyFilesStartingWith('CNAME');
	generateLocationsFile();

	var mergedHtml = await embedResources()
	var minifiedHtml = minify(mergedHtml, {
		minifyCSS: true,
		minifyJS: true
	});
	saveToFile(minifiedHtml, pagesFolder + '/index.html');

	/*	embedResources()
			.then((mergedHtml) => {
				var minifiedHtml = minify(mergedHtml, {
					minifyCSS: true,
					minifyJS: true
				});
				saveToFile(minifiedHtml, pagesFolder + '/index.html');
			});*/
}

function downloadCitiesZipAsync() {
	const file = fs.createWriteStream("cities15000.zip");
	return new Promise((resolve,reject) => {
		request(citiesDataURL)
			.pipe(file)
			.on('finish', ()=>file.close(resolve))
	});
}

function unzipCitiesAsync() {
	return new Promise(function (resolve, reject) {
		fs.createReadStream('cities15000.zip')
			.pipe(unzip.Extract({ path: '.' }))
			.on('close', resolve)
	});

}

function copyFilesStartingWith(startsWith) {
	fs.readdir('.', function (err, files) {
		files.forEach((file) => {
			if (file.startsWith(startsWith)) {
				fs.copyFile('./' + file, pagesFolder + '/' + file, (err) => {
					if (err)
						throw err;
				});
			}
		});
	});
}

function cleanResultsFolder() {
	fs.readdir(pagesFolder, (err, files) => {
		files.forEach((file) => {
			fs.unlink(pagesFolder + '/' + file);
		});
	});
}

function generateLocationsFile() {
	var countryCode2country = {};
	var location2zone = {};

	csvToMap('countryInfo.txt', countriesHeader,
		(row) => {
			if (!row['ISO'].startsWith('#')) {
				countryCode2country[row['ISO']] = row['Country'];
			}
		})
		.then(() => {
			csvToMap('cities15000.txt', citiesHeader,
				(row) => {
					if (!row['countryCode']) return;
					location2zone[countryCode2country[row['countryCode']] + ': ' + row['asciiname']] = row['timezone'];
				})
				.then(() => {
					saveToFile('var ' + locationsVarName + ' = ' + JSON.stringify(location2zone) + ';', './cityZone.json');
				});
		});
}


function embedResources() {
	//	var serializeDocument = require('jsdom').serializeDocument;
	var indexHtml = fs.readFileSync('./index.html', 'utf8');

	return new Promise((resolve, reject) => {
		jsdom.env(
			indexHtml,
			function (err, window) {
				var stylePromises = processStylesAsync(window.document);
				var scriptPromises = processScriptsAsync(window.document);
				Promise.all(stylePromises.concat(scriptPromises)).then(() => resolve(window.document.documentElement.outerHTML));
			}
		);
	});


	function processStylesAsync(document) {
		return Array.prototype.map.call(document.getElementsByTagName('link'), function (element) {
			return new Promise(function (resolve, reject) {
				if (element.rel !== 'stylesheet' || !(element.href)) {
					resolve();
					return;
				}

				var href = element.href;
				var styleElement = document.createElement('style');
				element.parentNode.insertBefore(styleElement, element);
				element.parentNode.removeChild(element);

				return populateElementAsync(styleElement, href, resolve);
			});
		});
	}

	function processScriptsAsync(document) {
		return Array.prototype.map.call(document.getElementsByTagName('script'), function (element) {
			return new Promise(function (resolve, reject) {
				if (!(element.src)) {
					resolve();
					return;
				}

				var src = element.src;
				element.removeAttribute('src');

				populateElementAsync(element, src, resolve);
			});
		});
	}

	function populateElementAsync(styleElement, href, done) {
		if (href.startsWith('http')) {
			populateElementByURLAsync(styleElement, href, done);
		} else {
			populateElementByFilePathAsync(styleElement, href, done);
		}

	}

	function populateElementByURLAsync(element, url, done) {
		var urlModule = require('url');
		var http = require(urlModule.parse(url).protocol.slice(0, -1));

		http.get(url, function (response) {
			response.on('data', function (chunk) {
				element.textContent += chunk.toString('utf8');
			});
			response.on('end', function () {
				done();
			});
		});
	}

	function populateElementByFilePathAsync(element, src, done) {
		var fs = require('fs');
		fs.readFile('./' + src, 'utf8', function (err, data) {
			if (err) throw err;
			element.textContent += data;
			done();
		});
	}

}

function saveToFile(content, filename) {
	var fs = require('fs');
	fs.writeFileSync(filename, content);
}

function csvToMap(filename, columns, rowCallback) {
	return new Promise(function (resolve, reject) {
		try {
			fs.createReadStream(filename)
				.pipe(csv({
					delimiter: '\t',
					headers: columns,
					quote: null
				}))
				.on('data', function (data) {
					try {
						rowCallback(data);
					} catch (e) {
						die(e, reject);
					}
				})
				.on('end', () => {
					resolve();
				})
				.on('error', (e) => {
					die(e, reject);
				});

		} catch (e) {
			die(e, reject);
		}
	});
}

function die(msg, callback) {
	console.log('error: ' + msg);
	if (callback) {
		callback(msg);
	}
	throw msg;
}

main();
