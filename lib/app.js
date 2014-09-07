var uuid = require('node-uuid');
var hub = require('./hub');
var childProcess = require('child_process');
var spawn = childProcess.spawn;

var apps = {};

module.exports.listen = function (io) {
    var app = io.of('/app');

    app.on('connection', function (socket) {
        socket.on('drone start', function (data) {
            console.log('event:drone start');
            console.log(data);
            var serv = hub.servers(data.server);
            if (!serv) {
                socket.emit('drone error', {
                    code: 404
                });
                return;
            }
            serv.startDrone(data.domain, function (err, data) {
                console.log('drone started');
                console.log(data);
                socket.emit('drone started', data);
            });
        });

        socket.on('drone stop', function (data) {
            console.log('event:drone stop');
            console.log(data);
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
            console.log('event:domain restart');
            console.log(data);
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