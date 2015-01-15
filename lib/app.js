var debug = require('debug')('serandules:hub');
var uuid = require('node-uuid');
var async = require('async');
var hub = require('./hub');
var mongoose = require('mongoose');
var Token = require('token');
var Config = require('./config').model;
var childProcess = require('child_process');
var spawn = childProcess.spawn;

var apps = {};

var auth = function (token, next) {
    Token.findOne({
        access: token
    })
        .exec(function (err, token) {
            if (err) {
                return next(err);
            }
            if (!token) {
                return next('invalid token');
            }
            next();
        });
};

var planQueue = async.queue(function (task, cb) {
    hub.plan(function (err, plan) {
        debug('updating plan with server : %s, domain : %s', task.ip, task.domain);
        debug(plan);
        var drones;
        var ip = task.ip;
        var domain = task.domain;
        drones = plan[ip] || (plan[ip] = []);
        var index = drones.indexOf(domain.id);
        if (index < 0) {
            return cb();
        }
        task.in ? drones.push(domain) : drones.splice(index, 1);
        hub.plan(plan, function (err, plan) {
            cb();
        });
    });
}, 1);

var updatePlan = function (server, domain) {
    planQueue.push({
        ip: server.server.ip,
        domain: domain,
        in: true
    }, function (err) {
        debug('plan update ' + (err ? 'failed' : 'succeeded'));
    });
};

var revisePlan = function (server, domain) {
    planQueue.push({
        ip: server.server.ip,
        domain: domain,
        in: false
    }, function (err) {
        debug('plan revise ' + (err ? 'failed' : 'succeeded'));
    });
};

module.exports.listen = function (io) {
    var app = io.of('/app');

    app.use(function (socket, next) {
        var query = socket.handshake.query;
        var token = query.token;
        if (!token) {
            return next('app token not found');
        }
        auth(token, function (err) {
            if (err) {
                return next('unauthorized hub-client');
            }
            next();
        });
    });

    app.on('connection', function (socket) {
        socket.on('drone start', function (data) {
            debug('event:drone start');
            debug(data);
            var serv = hub.servers(data.server);
            if (!serv) {
                socket.emit('drone error', {
                    code: 404
                });
                return;
            }
            var domain = data.domain;
            serv.startDrone(domain, function (err, data) {
                debug('drone started');
                debug(data);
                socket.emit('drone started', data);
                updatePlan(serv, domain);
            });
        });

        socket.on('drone stop', function (data) {
            debug('event:drone stop');
            debug(data);
            var server = hub.droneServer({
                id: data.id
            });
            var domain = hub.droneDomain({
                id: data.id
            });
            server.stopDrone({
                id: data.id,
                domain: domain.id
            });
            revisePlan(server, domain);
        });

        socket.on('self up', function (data) {
            process.send({
                event: 'self up'
            });
        });

        socket.on('clients up', function (data) {
            var id,
                servers = hub.servers();
            for (id in servers) {
                if (servers.hasOwnProperty(id)) {
                    servers[id].update();
                }
            }
        });

        socket.on('domain restart', function (data) {
            debug('event:domain restart');
            debug(data);
            var domain = hub.domains(data.id);
            if (!domain) {
                return;
            }
            domain.drones.forEach(function (drone) {
                var serv = hub.droneServer(drone);
                serv.stopDrone({
                    id: drone.id,
                    domain: data.id
                }, function (err, data) {
                    debug('drone stopped');
                });
                serv.startDrone(data.id, function (err, data) {
                    debug('drone started');
                });
            });
        });

        socket.id = uuid.v4();
        apps[socket.id] = socket;
    });

    app.on('disconnect', function (socket) {
        delete apps[socket.id];
    });
};