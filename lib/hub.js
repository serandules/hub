var uuid = require('node-uuid');
var socproc = require('socproc');
var Domain = require('./domain').model;

var servers = {};
var domains = {};

var Server = function (server) {
    this.id = server.id;
    this.req = {};
    this.server = server;
    var that = this;
    server.socket.on('drone started', function (data) {
        var req = that.req[data.id];
        if (!req) {
            return;
        }
        var domain = req.domain;
        var dom = domains[domain.id] || (domains[domain.id] = {
            domain: domain,
            drones: []
        });
        dom.drones.push({
            server: server.ip,
            port: data.port
        });
        delete that.req[data.id];
        delete data.id;
        req.cb(false, data);
    });
    server.socket.on('drone error', function (data) {
        console.log('drone error');
    });
    server.socket.on('drone stopped', function (data) {
        console.log('drone stopped');
    });
};

Server.prototype.startDrone = function (domain, cb) {
    var that = this;
    Domain.findOne({
        _id: domain
    }).exec(function (err, domain) {
        if (err) {
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
        /*that.server.socket.emit('drone start', {
            id: id,
            repo: domain.repo
        });*/
    });
};

Server.prototype.stopDrone = function (pid, cb) {

};

Server.prototype.restartDrone = function (pid, cb) {

};

module.exports.listen = function (io) {
    var sps = socproc('server', io);
    sps.on('connection', function (server) {
        console.log('connected');
        servers[server.id] = new Server(server);
    });
    sps.on('disconnect', function (server) {
        console.log('disconnected');
        delete servers[server.id];
    });
};

module.exports.servers = function (id) {
    if (id) {
        return servers[id];
    }
    var serv;
    var servs = [];
    for (id in servers) {
        if (servers.hasOwnProperty(id)) {
            serv = servers[id];
            servs.push({
                id: id,
                ip: serv.server.socket.client.request.socket.remoteAddress
            });
        }
    }
    return servs;
};

module.exports.domains = function (id) {
    return domains[id];
};
