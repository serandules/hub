var log = require('logger')('hub:lib:server');
var uuid = require('node-uuid');

var Domain = require('./domain');
var Config = require('./config');
var dron = require('./drone');
var Drone = dron.Drone;

var planKey = 'plan';

var servers = {};

var starting = {};

var listen = function (io) {
    io.on('connection', function (socket) {
        var server = new Server(uuid.v4(), socket);
        servers[server.id] = server;
        log.info('server connected id:%s, ip:%s', server.id, server.ip);

        loadPlan(server, function (err) {
            log.debug('default server plan loaded server:%s', server.id);
        });

        socket.on('disconnect', function () {
            var id;
            var server;
            for (id in servers) {
                if (servers.hasOwnProperty(id)) {
                    server = servers[id];
                    if (server.socket === socket) {
                        delete servers[id];
                        log.info('server disconnected id:%s, ip:%s', id, server.ip);
                        return;
                    }
                }
            }
        });
    });
};

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
        server.start(domain, function (err, id, ip, port) {
            log.debug('unmarshalled domain drone:%s, domain:%s, ip:%s, port:%s', id, domain, ip, port);
        });
    });
    return domains;
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

var savePlan = function (done) {
    var server;
    var serverz = {};
    for (server in servers) {
        if (servers.hasOwnProperty(server)) {
            server = servers[server];
            serverz[server.ip] = server.marshal();
        }
    }
    Config.findOne({
        name: planKey
    }).exec(function (err, config) {
        if (err) {
            log.error('error updating planKey: %s', err);
            return done(err);
        }
        if (config) {
            Config.update({
                _id: config.id
            }, {
                value: JSON.stringify(serverz)
            }, function (err, config) {
                if (err) {
                    log.error('error updating planKey: %s', err);
                }
                done(err);
            });
            return;
        }
        Config.create({
            name: planKey,
            value: JSON.stringify(serverz)
        }, function (err, config) {
            if (err) {
                log.error('error saving planKey: %s', err);
            }
            done(err);
        });
    });
};

var removePlan = function (done) {
    Config.findOne({
        name: planKey
    }).exec(function (err, config) {
        if (err) {
            log.error('error updating planKey: %s', err);
            return done(err);
        }
        config.remove();
        done();
    });
};

var loadPlan = function (server, done) {
    Config.findOne({
        name: planKey
    }).exec(function (err, config) {
        if (err) {
            log.error('error updating planKey: %s', err);
            return done(err);
        }
        if (!config) {
            return done();
        }
        var ip;
        var servers = JSON.parse(config.value);
        for (ip in servers) {
            if (servers.hasOwnProperty(ip)) {
                if (ip !== server.ip) {
                    continue;
                }
                server.unmarshal(servers[ip]);
            }
        }
        done();
    });
};

var restartDomain = function (domain, done) {
    var server;
    for (server in servers) {
        if (servers.hasOwnProperty(server)) {
            server = servers[server];
            server.restart(domain);
        }
    }
    done();
};


module.exports.servers = function (id) {
    return id ? servers[id] : servers;
};
module.exports.savePlan = savePlan;

module.exports.removePlan = removePlan;

module.exports.drone = drone;

module.exports.drones = drones;

module.exports.removeDrone = removeDrone;

module.exports.restartDomain = restartDomain;

module.exports.listen = listen;