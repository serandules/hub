var mongoose = require('mongoose');
var configs = require('hub-configs');

module.exports.hub = mongoose.createConnection('mongodb://localhost/hub');

module.exports.serand = mongoose.createConnection('mongodb://localhost/serandives');
