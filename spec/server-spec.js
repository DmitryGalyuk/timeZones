describe("WebServer module", function () {
  var WebServer = require('../server/index.js');
  var server = new WebServer();
  it("should return instance of WebServer", function () {
    expect(server instanceof WebServer).toBeTruthy();
  });

  it("should have test method", function () {
      expect(server.test).toBeDefined();
  });
});
