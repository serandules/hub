var log = require('logger')('hub:lib:server');
var uuid = require('node-uuid');

var Domain = require('./domain');
var dron = require('./drone');
var Drone = dron.Drone;

var starting = {};

var Server = function (id, socket, hub) {
    var server = this;
    server.id = id;
    server.hub = hub;
    server.ip = socket.handshake.address;
    server.socket = socket;
    server.dronez = {};
    server.socket.on('started', function (id, domain, pid, port) {
        var drone = starting[id];
        drone = new Drone({
            id: id,
            name: drone.name,
            hub: hub,
            domain: domain,
            server: server,
            port: port,
            pid: pid
        });
        server.dronez[id] = drone;
        delete starting[id];
        hub.emit('joined', id, drone.name, server.ip, port);
        log.debug('node started id:%s, domain:%s, pid:%s, port:%s', id, drone.name, pid, port);
    });

    server.socket.on('stopped', function (id) {
        var drone = server.dronez[id];
        delete server.dronez[id];
        hub.emit('left', id, drone.name, server.ip, drone.port);
    });

    server.socket.on('restarted', function (id, domain, pid, port) {
        var drone = server.dronez[id];
        drone.port = port;
        drone.pid = pid;
        hub.emit('rejoined', id, drone.name, server.ip, drone.port);
    });

    server.socket.on('sync', function (drones) {
        server.sync(drones);
        log.debug('synced server:%s, drones:%j', server.id, drones);
    });
};

Server.prototype.up = function () {
    this.socket.emit('up');
};

Server.prototype.down = function () {
    this.socket.emit('down');
};

Server.prototype.start = function (domain) {
    var server = this;
    Domain.findOne({
        _id: domain
    }).exec(function (err, domain) {
        if (!domain) {
            return done(404, 'domain not found');
        }
        var id = uuid.v4();
        starting[id] = {
            domain: domain.id,
            name: domain.name,
            repo: domain.repo
        };
        server.socket.emit('start', id, domain.id, domain.repo);
    });
};

Server.prototype.restart = function (domain) {
    var server = this;
    var drones = server.dronez;
    var drone;
    for (drone in drones) {
        if (drones.hasOwnProperty(drone)) {
            drone = drones[drone];
            if (drone.domain !== domain) {
                continue;
            }
            server.socket.emit('restart', drone.id);
        }
    }
};

Server.prototype.stop = function (drone) {
    var server = this;
    drone = server.dronez[drone];
    server.socket.emit('stop', drone.id);
};

Server.prototype.started = function (drone) {
    this.dronez[drone.id] = drone;
    delete starting[drone.id];
};

Server.prototype.sync = function (drones) {
    var drone;
    var server = this;
    for (drone in drones) {
        if (drones.hasOwnProperty(drone)) {
            drone = drones[drone];
            Domain.findOne({
                _id: drone.domain
            }, (function (drone) {
                return function (err, domain) {
                    if (err || !domain) {
                        log.error('drone advertised with an invalid domain:%s', drone.domain);
                        return;
                    }
                    server.dronez[drone.id] = new Drone({
                        id: drone.id,
                        name: domain.name,
                        hub: server.hub,
                        domain: drone.domain,
                        server: server,
                        port: drone.port,
                        pid: drone.pid
                    });
                };
            })(drone));
        }
    }
};

Server.prototype.drones = function (id) {
    return id ? this.dronez[id] : this.dronez;
};

Server.prototype.marshal = function () {
    var domains = [];
    var drone;
    var drones = this.dronez;
    for (drone in drones) {
        if (drones.hasOwnProperty(drone)) {
            drone = drones[drone];
            domains.push(drone.domain);
        }
    }
    log.debug(domains);
    return domains;
};

Server.prototype.unmarshal = function (domains) {
    var server = this;
    domains.forEach(function (domain) {
        server.start(domain, function (err) {
            log.debug('unmarshalled domain domain:%s', domain);
        });
    });
    return domains;
};

module.exports = Server;