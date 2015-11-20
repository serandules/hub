var log = require('logger')('hub:lib:hub');
var util = require('util');
var events = require('events');
var uuid = require('node-uuid');
var procevent = require('procevent')(process);

var Config = require('config');
var Server = require('./server');

var planKey = 'plan';

var servers = {};

var drones = [];

var Hub = function () {

};

util.inherits(Hub, events.EventEmitter);

var hub = new Hub();

hub.on('joined', function (id, domain, ip, port) {
    drones.forEach(function (drone) {
        drone.socket.emit('joined', id, domain, ip, port);
    });
});

hub.on('left', function (id, domain, ip, port) {
    drones.forEach(function (drone) {
        drone.socket.emit('left', id, domain, ip, port);
    });
});

hub.on('rejoined', function (id, domain, ip, port) {
    drones.forEach(function (drone) {
        drone.socket.emit('rejoined', id, domain, ip, port);
    });
});

var serverz = function (id) {
    return id ? servers[id] : servers;
};

var listenServers = function (io) {
    io.on('connection', function (socket) {
        var server = new Server(uuid.v4(), socket, hub);
        servers[server.id] = server;
        log.info('server connected id:%s, ip:%s', server.id, server.ip);

        socket.on('unmarshal', function () {
            loadPlan(server, function (err) {
                log.debug('default server plan loaded server:%s', server.id);
            });
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

var listenDrones = function (io) {
    io.on('connection', function (socket) {
        log.debug('drone connected');
        var server;
        var drone;
        var dronez;
        for (server in servers) {
            if (servers.hasOwnProperty(server)) {
                server = servers[server];
                dronez = server.drones();
                for (drone in dronez) {
                    if (dronez.hasOwnProperty(drone)) {
                        drone = dronez[drone];
                        log.debug('emitting joined drone:%s, domain:%s, ip:%s, port:%s', drone.id, drone.name, drone.ip, drone.port);
                        socket.emit('joined', drone.id, drone.name, drone.ip, drone.port);
                    }
                }
            }
        }

        drones.push({
            socket: socket
        });

        socket.on('disconnect', function () {
            log.debug('drone disconnected');
            drones.every(function (drone, i) {
                if (drone.socket !== socket) {
                    return true;
                }
                drones.splice(i, 1);
            });
        });
    });
};

var listenConfigs = function (io) {
    io.on('connection', function (socket) {
        log.debug('config agent connected');
        socket.on('config', function (id, name) {
            Config.findOne({
                name: name
            }).exec(function (err, config) {
                if (err) {
                    log.error('error finding config:%s, error:%e', name, err);
                    return;
                }
                socket.emit(id, config ? config.value : null);
            });
        });
    });
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

var dronez = function (domain) {
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

var startDrone = function (server, domain) {
    var serv = serverz(server);
    serv.start(domain);
};

var stopDrone = function (id) {
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
            log.error('error updating planKey: %e', err);
            return done(err);
        }
        if (config) {
            Config.update({
                name: planKey
            }, {
                value: JSON.stringify(serverz)
            }, function (err, config) {
                if (err) {
                    log.error('error updating planKey: %e', err);
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
                log.error('error saving planKey: %e', err);
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
            log.error('error updating planKey: %e', err);
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
            log.error('error updating planKey: %e', err);
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

module.exports.up = function () {
    procevent.emit('up');
};

module.exports.servers = serverz;

module.exports.savePlan = savePlan;

module.exports.removePlan = removePlan;

module.exports.drone = drone;

module.exports.drones = dronez;

module.exports.startDrone = startDrone;

module.exports.stopDrone = stopDrone;

module.exports.restartDomain = restartDomain;

module.exports.listenServers = listenServers;

module.exports.listenDrones = listenDrones;

module.exports.listenConfigs = listenConfigs;