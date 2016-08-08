/*jslint node: true */
/*jslint esversion: 6 */
'use strict';

var path = require('path');
var url = require('url');
var fs = require('fs');

function Router() {}

Router.prototype = {
    config: {
        wwwPath: 'www',
        apiPath: 'api'
    },

    route: function(requestUrl) {
        var resourcePath = this.buildPathToResource(requestUrl);
        this.validatePath(resourcePath);
        this.ensureFileExists(resourcePath);

        return true;
    },

    buildPathToResource: function(requestUrl) {
        var requestPathname = url.parse(requestUrl).pathname;
        var currentFolder = process.env.PWD;
        var folderPrefix='';

        if (!requestPathname.startsWith('/'+this.config.apiPath)) {
            folderPrefix = this.config.wwwPath;
        }

        var resultPath = path.join(currentFolder, folderPrefix, requestPathname);
        return resultPath;
    },

    validatePath: function(path) {
        var currentFolder = process.env.PWD;

        if (!path.startsWith(currentFolder)) {
            throw new Error('access denied');
        }

    },

    ensureFileExists: function(path){
      fs.accessSync(path, fs.R_OK);
    }
};

module.exports = Router;
