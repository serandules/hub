var log = require('logger')('hub:lib:drone');
var uuid = require('node-uuid');

var Drone = function (id, domain, server, port, pid) {
    this.id = id;
    this.domain = domain;
    this.ip = server.ip;
    this.pid = pid;
    this.server = server;
    this.port = port;
};

module.exports.Drone = Drone;

module.exports.listen = function (io) {
    io.on('connection', function (socket) {
        log.debug('drone connected');
    });
};