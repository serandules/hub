var uuid = require('node-uuid');

var apps = {};
var servers = {};

module.exports = function (sps, app) {
    sps.on('connection', function (server) {
        server.socket.on('drone started', function (data) {
            var app = server.req[data.id];
            if (!app) {
                return;
            }
            delete server.req[data.id];
            delete data.id;
            app.emit('drone started', data);
        });
        server.socket.on('drone error', function (data) {
            console.log('drone error');
        });
        server.socket.on('drone stopped', function (data) {
            console.log('drone stopped');
        });
        servers[server.id] = server;
    });
    sps.on('disconnect', function (server) {
        delete servers[server.id];
    });
    app.on('connection', function (socket) {
        socket.on('drone start', function (data) {
            var serv = servers[data.id];
            if (!serv) {
                socket.emit('drone error', {
                    code: 404
                });
                return;
            }
            var req = serv.reqs || (serv.reqs = {});
            data.id = uuid.v4();
            req[data.id] = {
                app: socket
            };
            serv.socket.emit('drone start', data);
        });
        socket.id = uuid.v4();
        apps[socket.id] = socket;
    });
    app.on('disconnect', function (socket) {
        delete apps[socket.id];
    });
};

module.exports.servers = function () {
    var id, serv,
        servs = [];
    for (id in servers) {
        if (servers.hasOwnProperty(id)) {
            serv = servers[id];
            servs.push({
                id: id,
                ip: serv.socket.client.request.socket.remoteAddress
            });
        }
    }
    return servs;
};