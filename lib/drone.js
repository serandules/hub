var log = require('logger')('hub:lib:drone');
var uuid = require('node-uuid');

var Drone = function (options) {
    this.hub = options.hub;
    this.id = options.id;
    this.domain = options.domain;
    this.ip = options.server.ip;
    this.pid = options.pid;
    this.server = options.server;
    this.port = options.port;
};

module.exports.Drone = Drone;