/*jslint node: true */
/*jslint esversion: 6 */
/*jshint -W069 */
'use strict';

var locationsVarName = 'locationZone';
var fs = require("fs");
var jsdom = require("jsdom");
var csv = require('fast-csv');
let minify = require('html-minifier').minify;

var citiesHeader = ['geonameid', 'name', 'asciiname', 'alternatenames', 'latitude', 'longitude',
    'featureClass', 'featureCode', 'countryCode', 'cc2', 'admin1Code', 'admin2Code', 'admin3Code', 'admin4Code',
    'population', 'elevation', 'dem', 'timezone', 'modificationDate'
];
var countriesHeader = ['ISO', 'ISO3', 'ISO-Numeric', 'fips', 'Country', 'Capital',
    'Area', 'Population', 'Continent', 'tld', 'CurrencyCode', 'CurrencyName', 'Phone',
    'PostalCodeFormat', 'PostalCodeRegex', 'Languages', 'geonameid', 'neighbours', 'EquivalentFipsCode'
];
main();

function main() {
    generateLocationsFile();
    embedResources()
    .then((mergedHtml) => {
        var minifiedHtml = minify(mergedHtml, {minifyCSS: true, minifyJS: true});
        saveToFile(minify(minifiedHtml), "./timeZones.html");
    });
}

function generateLocationsFile() {
    var countryCode2country = {};
    var country2capital = {};
    var location2zone = {};

    csvToMap('countryInfo.txt', countriesHeader,
            (row) => {
                if (!row["ISO"].startsWith("#")) {
                    countryCode2country[row["ISO"]] = row["Country"];
                }
                if (row["Capital"]) {
                    country2capital[row["Country"]] = row["Capital"];
                }
            })
        .then(() => {
            csvToMap('cities15000.txt', citiesHeader,
                    (row) => {
                        // if (row["population"] < 500000) return;
                        if (!row['countryCode']) return;
                        location2zone[countryCode2country[row['countryCode']] + ": " + row['asciiname']] = row['timezone'];
                    })
                .then(() => {
                    // console.log(location2zone);
                    Object.keys(country2capital).forEach((country) => location2zone[country] = location2zone[country2capital[country]]);

                    saveToFile('var ' + locationsVarName + ' = ' + JSON.stringify(location2zone) + ';', "./cityZone.json");
                });
        });
}


function embedResources() {
    var serializeDocument = require("jsdom").serializeDocument;
    var indexHtml = fs.readFileSync("./index.html", "utf8");

    return new Promise((resolve, reject) => {
        jsdom.env(
            indexHtml,
            function(err, window) {
                var stylePromises = processStylesAsync(window.document);
                var scriptPromises = processScriptsAsync(window.document);
                Promise.all(stylePromises.concat(scriptPromises)).then(() => resolve(window.document.documentElement.outerHTML));
            }
        );
    });


    function processStylesAsync(document) {
        return Array.prototype.map.call(document.getElementsByTagName("link"), function(element) {
            return new Promise(function(resolve, reject) {
                if (element.rel !== "stylesheet" || !(element.href)) {
                    resolve();
                    return;
                }

                var href = element.href;
                var styleElement = document.createElement("style");
                element.parentNode.insertBefore(styleElement, element);
                element.parentNode.removeChild(element);

                return populateElementAsync(styleElement, href, resolve);
            });
        });
    }

    function processScriptsAsync(document) {
        return Array.prototype.map.call(document.getElementsByTagName("script"), function(element) {
            return new Promise(function(resolve, reject) {
                if (!(element.src)) {
                    resolve();
                    return;
                }

                var src = element.src;
                element.removeAttribute("src");

                populateElementAsync(element, src, resolve);
            });
        });
    }

    function populateElementAsync(styleElement, href, done) {
        if (href.startsWith("http")) {
            populateElementByURLAsync(styleElement, href, done);
        } else {
            populateElementByFilePathAsync(styleElement, href, done);
        }

    }

    function populateElementByURLAsync(element, url, done) {
        var urlModule = require("url");
        var http = require(urlModule.parse(url).protocol.slice(0, -1));

        http.get(url, function(response) {
            response.on("data", function(chunk) {
                element.textContent += chunk.toString("utf8");
            });
            response.on("end", function() {
                done();
            });
        });
    }

    function populateElementByFilePathAsync(element, src, done) {
        var fs = require("fs");
        fs.readFile("./" + src, "utf8", function(err, data) {
            if (err) throw err;
            element.textContent += data;
            done();
        });
    }

}

function saveToFile(content, filename) {
    var fs = require("fs");
    fs.writeFileSync(filename, content);
}

function csvToMap(filename, columns, rowCallback) {
    return new Promise(function(resolve, reject) {
        try {
            console.log(filename);
            var linesRead = 0;
            fs.createReadStream(filename)
                .pipe(csv({
                    delimiter: '\t',
                    headers: columns,
                    quote: null
                }))
                .on('data', function(data) {
                    try {
                        rowCallback(data);
                        linesRead++;
                    } catch (e) {
                        die(e, reject);
                    }
                })
                .on('end', () => {
                    console.log(filename + ": " + linesRead + " lines read");
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
    console.log("error: " + msg);
    if (callback) {
        callback(msg);
    }
    throw msg;
}
