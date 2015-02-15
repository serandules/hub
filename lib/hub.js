var log = require('logger')('hub');
var socproc = require('socproc');
var utils = require('utils');
var uuid = require('node-uuid');

var Domain = require('./domain').model;

var servers = {};

var pending = {};

var serverByDrone = function (drone) {
    var server;
    for (server in servers) {
        if (servers.hasOwnProperty(server)) {
            server = servers[server];
            if (server.drones[drone]) {
                return server;
            }
        }
    }
};

module.exports.listen = function (io) {
    var sps = socproc('server', io);
    sps.use(function (socket, next) {
        var query = socket.handshake.query;
        var token = query.token;
        if (!token) {
            return next('hub-client token not found');
        }
        if (token !== token) {
            return next('unauthorized hub-client');
        }
        next();
    });
    sps.on('connection', function (server) {
        log.info('connected server : %s', server.id);
        var socket = server.socket;
        socket.on('emit', function (event, id, args) {
            log.info('emitton request for : %s, %s, %s', event, id, args);
            socket.emit('emitted', id, ['pqrstuvwxyz']);
        });
        socket.on('drone started', function (id, port) {
            var data = pending[id];
            var server = servers[data.server];
            var drones = server.drones[data.domain] || (server.drones[data.domain] = []);
            drones.push({
                id: id,
                ip: server.ip,
                port: port,
                domain: data.domain
            });
        });
        servers[sps.id] = {
            socket: socket,
            ip: socket.client.request.socket.remoteAddress,
            drones: {}
        };
    });
    sps.on('disconnect', function (server) {
        log.info('disconnected server : %s', server.id);
    });
};

module.exports.servers = function (serverId) {
    return serverId ? servers[serverId] : servers;
};

module.exports.drones = function (domainId, done) {
    Domain.findOne({
        _id: domainId
    }).exec(function (err, domain) {
        if (err) {
            log.error(err);
            return done(err);
        }
        var drones = [];
        var server;
        var drns;
        for (server in servers) {
            if (servers.hasOwnProperty(server)) {
                server = servers[server];
                drns = server.drones[domain] || [];
                drns.forEach(function (drone) {
                    drones.push({

                    })
                });
            }
        }
    });
};

module.exports.start = function (serverId, domainId) {
    var server = servers[serverId];
    Domain.findOne({
        _id: domainId
    }).exec(function (err, domain) {
        if (err) {
            log.error(err);
            return;
        }
        var id = uuid.v4();
        pending[id] = {
            at: new Date().getTime(),
            server: serverId,
            domainId: domainId,
            domain: domain.name,
            repo: domain.repo
        };
        serverId.socket.emit('drone start', id, domain.name, domain.repo);
    });
};

module.exports.stop = function (droneId) {
    var server = serverByDrone(droneId);
    server.socket.emit('drone stop', {
        drone: droneId
    });
};

module.exports.restart = function (domainId) {
    var server = serverByDrone(drone);
    var dron = server.drones[drone];
    module.exports.stop(drone);
};
