var uuid = require('node-uuid');
var socproc = require('socproc');
var Domain = require('./domain').model;

var servers = {};
var domains = {};
var drones = {};

var joinDrone = function (server, domain, drone) {
    console.log('joinDrone server:' + server.id + ' domain:' + domain.id);
    console.log(drone);
    drone.ip = server.ip;
    server.drones.push(drone);
    domain.drones.push(drone);
    drones[drone.id] = {
        server: server,
        domain: domain
    };
    server.server.socket.emit('drone joined', drone);
    console.log('fired:drone joined');
};

var leaveDrone = function (server, domain, drone) {
    console.log('leaveDrone server:' + server.id + ' domain:' + domain.id);
    console.log(drone);
    var i,
        length = server.drones.length;
    for (i = 0; i < length; i++) {
        if (server.drones[i].id === drone.id) {
            server.drones.splice(i, 1);
            break;
        }
    }
    length = domain.drones.length;
    for (i = 0; i < length; i++) {
        if (domain.drones[i].id === drone.id) {
            domain.drones.splice(i, 1);
            break;
        }
    }
    server.server.socket.emit('drone left', drone);
    console.log('fired:drone left');
    delete drones[drone.id];
};

var droneServer = function (drone) {
    return drones[drone.id].server;
};
module.exports.droneServer = droneServer;

var droneDomain = function (drone) {
    return drones[drone.id].domain;
};
module.exports.droneDomain = droneDomain;

var Server = function (server) {
    this.id = server.id;
    this.req = {};
    this.server = server;
    this.drones = [];
    var that = this;
    server.socket.on('drone started', function (data) {
        console.log('event:drone started');
        console.log(data);
        var req = that.req[data.id];
        if (!req) {
            console.log('drone started request not found');
            return;
        }
        var domain = req.domain;
        var dom = domains[domain.id] || (domains[domain.id] = {
            domain: domain,
            drones: []
        });
        joinDrone(server, dom, data);
        delete that.req[data.id];
        req.cb(false, data);
    });
    server.socket.on('drone error', function (data) {
        console.log('drone error');
    });
    server.socket.on('drone stopped', function (data) {
        console.log('event:drone stopped');
        leaveDrone(server, droneDomain(data), data);
    });
    server.socket.on('self drones', function (data) {
        console.log('event:self drones');
        console.log(data);
        var dom, drns;
        for (dom in data) {
            if (data.hasOwnProperty(dom)) {
                drns = data[dom];
                drns.forEach(function (drn) {
                    joinDrone(server, domains[dom], drn);
                });
            }
        }
    });
};

Server.prototype.startDrone = function (domain, cb) {
    var that = this;
    console.log('startDrone domain:' + domain);
    Domain.findOne({
        _id: domain
    }).exec(function (err, domain) {
        if (err) {
            console.log(err);
            //TODO: send proper HTTP code
            cb(true, 404);
            return;
        }
        var id = uuid.v4();
        that.req[id] = {
            domain: domain,
            cb: cb
        };
        console.log(domain);
        var data = {
            id: id,
            repo: domain.repo,
            domain: domain.name
        };
        that.server.socket.emit('drone start', data);
        console.log('fired:drone start server:' + that.id + ' domain:' + domain.id);
        console.log(data);
    });
};

Server.prototype.stopDrone = function (data, cb) {
    leaveDrone(this, droneDomain(data), data);
    this.server.socket.emit('drone stop', {
        id: data.id
    });
    console.log('fired:drone stop');
};

Server.prototype.update = function () {
    this.server.socket.emit('self up');
    console.log('fired:self up');
};

module.exports.listen = function (io) {
    var sps = socproc('server', io);
    sps.on('connection', function (server) {
        console.log('event:connection server:' + server.id);
        servers[server.id] = new Server(server);
    });
    sps.on('disconnect', function (server) {
        console.log('event:disconnect server:' + server.id);
        server = servers[server.id];
        server.drones.forEach(function (drone) {
            leaveDrone(server, droneDomain(drone), drone);
        });
        delete servers[server.id];
    });
};

module.exports.servers = function (id) {
    return id ? servers[id] : servers;
};

module.exports.domains = function (id) {
    return id ? domains[id] : domains;
};