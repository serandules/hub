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

        socket.on('self up', function (data) {
            process.send({
                event: 'self up'
            });
        });

        socket.on('clients up', function (data) {
            
        });

        socket.id = uuid.v4();
        apps[socket.id] = socket;
    });

    app.on('disconnect', function (socket) {
        delete apps[socket.id];
    });
};