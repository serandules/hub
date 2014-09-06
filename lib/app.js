var uuid = require('node-uuid');
var hub = require('./hub');
var childProcess = require('child_process');
var spawn = childProcess.spawn;

var apps = {};

module.exports.listen = function (io) {
    var app = io.of('/app');

    app.on('connection', function (socket) {
        socket.on('drone start', function (data) {
            var serv = hub.servers(data.server);
            if (!serv) {
                socket.emit('drone error', {
                    code: 404
                });
                return;
            }
            serv.startDrone(data.domain, function (err, data) {
                console.log(data);
                socket.emit('drone started', data);
            });
        });

        socket.on('drone stop', function (data) {
            console.log('stop drone request');
            var i, length, id, drone, drones, domain;
            var domains = hub.domains();
            L1:
                for (id in domains) {
                    if (domains.hasOwnProperty(id)) {
                        domain = domains[id];
                        drones = domain.drones;
                        length = drones.length;
                        for (i = 0; i < length; i++) {
                            drone = drones[i];
                            if (drone.id === data.id) {
                                hub.servers(drone.server).stopDrone({
                                    id: data.id,
                                    domain: id
                                }, function (err, data) {
                                    console.log('drone stopped');
                                });
                                break L1;
                            }
                        }
                    }
                }
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
            console.log(data);
            console.log('domain restart request');
            var domain = hub.domains(data.id);
            domain.drones.forEach(function (drone) {
                var serv = hub.servers(drone.server);
                serv.stopDrone({
                    id: drone.id,
                    domain: data.id
                }, function (err, data) {
                    console.log('drone stopped');
                });
                serv.startDrone(data.id, function (err, data) {
                    console.log('drone started');
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