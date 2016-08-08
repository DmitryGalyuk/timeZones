/*jslint jasmine: true */
/*jslint esversion: 6 */
/*jslint node: true */
'use strict';

describe("router", function () {

  console.log(process.env.PWD);

  var Router = require('../server/router.js');
  var router = new Router();

  it("should throw Error for path outside current folder", function () {
    expect(()=>router.route('../../../../../../../../../etc/passwd')).toThrow();
  });

  it("should search for static files in Router.wwwPath", function () {
    expect(router.route('index.html')).toBeTruthy();
  });

  it("should search for static files in Router.wwwPath and subfolders", function () {
    expect(router.route('/js/app.js')).toBeTruthy();
  });

  it("should search for api's in Router.apiPath", function () {
    expect(router.route('/api/test.js')).toBeTruthy();
  });


  it("should throw Error if resource not found", function () {
    expect(()=>router.route('indeXXX.html')).toThrow();
  });


});
