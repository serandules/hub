var log = require('logger')('hub:lib:client');
var hub = require('./hub');

module.exports.up = function () {
    var servers = hub.servers();
    var serv;
    for (serv in servers) {
        if (servers.hasOwnProperty(serv)) {
            serv = servers[serv];
            serv.socket.emit('up');
            log.debug('emitted client up server:%s', serv.ip);
        }
    }
};