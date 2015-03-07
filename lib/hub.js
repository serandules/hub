var log = require('logger')('hub:lib:hub');
var procevent = require('procevent')(process);

module.exports.up = function () {
    procevent.emit('up');
};