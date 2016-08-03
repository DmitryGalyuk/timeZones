"use script";


var jsdom = require("jsdom");
var serializeDocument = require("jsdom").serializeDocument;
var fs = require("fs");

var indexHtml = fs.readFileSync("./index.html", "utf8");

jsdom.env(
    indexHtml,
    function(err, window) {
        var stylePromises = processStylesAsync(window.document);
        var scriptPromises = processScriptsAsync(window.document);
        Promise.all(stylePromises.concat(scriptPromises)).then(function() {
            saveToFile(window.document.documentElement.outerHTML, "./timeZones.html");
        });
    }
);

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

function saveToFile(content, filename) {
    var fs = require("fs");
    fs.writeFileSync(filename, content);
}
