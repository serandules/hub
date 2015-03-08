var log = require('logger')('hub:lib:server');
var uuid = require('node-uuid');

var Domain = require('./domain');
var dron = require('./drone');
var Drone = dron.Drone;

var servers = {};

var starting = {};

var Server = function (id, socket) {
    this.id = id;
    this.ip = socket.handshake.address;
    this.socket = socket;
    this.dronez = {};
    var server = this;
    this.socket.on('started', function (id, pid, port) {
        var drone = starting[id];
        var done = drone.done;
        drone = new Drone(id, drone.domain, server, port, pid);
        server.dronez[id] = drone;
        delete starting[id];
        done(false, id, server.ip, port);
    });
};

Server.prototype.up = function () {
    this.socket.emit('up');
};

Server.prototype.down = function () {
    this.socket.emit('down');
};

Server.prototype.start = function (domain, done) {
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
            repo: domain.repo,
            done: done
        };
        server.socket.emit('start', id, domain.repo);
    });
};

Server.prototype.stop = function (drone, done) {
    var server = this;
    drone = server.dronez[drone];
    if (!drone) {
        return done(true, 'not found');
    }
    delete server.dronez[drone.id];
    server.socket.emit('stop', drone.id);
};

Server.prototype.started = function (drone) {
    this.dronez[drone.id] = drone;
    delete starting[drone.id];
};

Server.prototype.drones = function (id) {
    return id ? this.dronez[id] : this.dronez;
};

module.exports.servers = function (id) {
    return id ? servers[id] : servers;
};

var drone = function (id) {
    var serv;
    var drone;
    var server;
    for (server in servers) {
        if (servers.hasOwnProperty(server)) {
            serv = servers[server];
            drone = serv.dronez(id);
            if (!drone) {
                continue;
            }
            drone.server = serv;
            return drone;
        }
    }
};

var drones = function (domain) {
    var server;
    var drone;
    var drones;
    var dronez = [];
    for (server in servers) {
        if (servers.hasOwnProperty(server)) {
            server = servers[server];
            drones = server.drones();
            for (drone in drones) {
                if (drones.hasOwnProperty(drone)) {
                    drone = drones[drone];
                    if (drone.domain !== domain) {
                        continue;
                    }
                    dronez.push(drone);
                }
            }
        }
    }
    return dronez;
};

var removeDrone = function (id) {
    var serv;
    var drone;
    var server;
    for (server in servers) {
        if (servers.hasOwnProperty(server)) {
            serv = servers[server];
            drone = serv.drones(id);
            if (!drone) {
                continue;
            }
            return serv.stop(id);
        }
    }
};

module.exports.drone = function (id) {
    return drone(id);
};

module.exports.drones = function (domain) {
    return drones(domain);
};

module.exports.removeDrone = function (id) {
    removeDrone(id);
};

module.exports.listen = function (io) {
    io.on('connection', function (socket) {
        log.info('server connected');
        var id = uuid.v4();
        servers[id] = new Server(id, socket);
        socket.on('disconnect', function () {
            var id;
            for (id in servers) {
                if (servers.hasOwnProperty(id)) {
                    if (servers[id].socket === socket) {
                        delete servers[id];
                        return;
                    }
                }
            }
        })
    });
};