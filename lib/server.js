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
        var name = drone.name;
        var done = drone.done;
        drone = new Drone({
            id: id,
            hub: hub,
            domain: domain,
            server: server,
            port: port,
            pid: pid
        });
        server.dronez[id] = drone;
        delete starting[id];
        hub.emit('joined', id, name, server.ip, port);
        done(false, id, server.ip, port);
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
            name: domain.name,
            repo: domain.repo,
            done: done
        };
        server.socket.emit('start', id, domain.id, domain.repo);
        done();
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

Server.prototype.stop = function (drone, done) {
    var server = this;
    drone = server.dronez[drone];
    if (!drone) {
        return done(true, 'not found');
    }
    delete server.dronez[drone.id];
    server.socket.emit('stop', drone.id);
    done();
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
            server.dronez[drone.id] = new Drone(drone.id, drone.domain, server, drone.port, drone.pid);
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