var log = require('logger')('hub:lib:hub');
var uuid = require('node-uuid');
var procevent = require('procevent')(process);

var Config = require('./config');
var Server = require('./server');

var planKey = 'plan';

var servers = {};

var listen = function (io) {
    io.on('connection', function (socket) {
        var server = new Server(uuid.v4(), socket);
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

module.exports.up = function () {
    procevent.emit('up');
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