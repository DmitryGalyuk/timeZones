var fs = require('fs');
var posix = require('posix');
posix.chroot('./');
console.log(fs.readFileSync('./js/../../../../../../../../../../../../../../../../../../etc/passwd','utf8'));
