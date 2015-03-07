var log = require('logger')('hub:lib:server');
var uuid = require('node-uuid');

var drone = require('./drone');
var Drone = drone.Drone;

var servers = {};

var starting = {};

var Server = function (id, socket) {
    this.id = id;
    this.ip = socket.handshake.address;
    this.socket = socket;
    this.drones = {};
    var server = this;
    this.socket.on('started', function (id, pid, port) {
        var drone = starting[id];
        var done = drone.done;
        drone = new Drone(id, drone.repo, server, port, pid);
        server.drones[id] = drone;
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

Server.prototype.start = function (repo, done) {
    var id = uuid.v4();
    starting[id] = {
        repo: repo,
        done: done
    };
    this.socket.emit('start', id, repo);
};

Server.prototype.started = function (drone) {
    this.drones[drone.id] = drone;
    delete starting[drone.id];
};

Server.prototype.drones = function (id) {
    return id ? this.drones[id] : this.drones;
};

module.exports.servers = function (id) {
    return id ? servers[id] : servers;
};

module.exports.drone = function (id) {
    var serv;
    var drone;
    var server;
    for (server in servers) {
        if (servers.hasOwnProperty(server)) {
            serv = servers[server];
            drone = serv.drones[id];
            if (drone) {
                drone.server = serv;
                return drone;
            }
        }
    }
};

module.exports.drones = function (server, drone) {
    var serv = servers[server];
    return drone ? serv.drones[drone] : serv.drones;
};

module.exports.listen = function (io) {
    io.on('connection', function (socket) {
        log.info('server connected');
        var id = uuid.v4();
        servers[id] = new Server(id, socket);
        //socket.emit('start', uuid.v4(), 'https://github.com/serandules/autos.git');
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