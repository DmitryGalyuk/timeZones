var serveStatic = require('serve-static');
var connect = require('connect');
var port = process.env.PORT || 80;
connect().use(serveStatic(__dirname)).listen(port, function(){
    console.log('Server running on ' + port + '...');
});
