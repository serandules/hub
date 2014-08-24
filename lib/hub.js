var uuid = require('node-uuid');
var socproc = require('socproc');
var Domain = require('./domain').model;

var servers = {};
var domains = {};

var fireDrones = function (servers) {
    var id;
    for (id in servers) {
        if (servers.hasOwnProperty(id)) {
            servers[id].server.socket.emit('drones update', domains);
        }
    }
};

var Server = function (server) {
    this.id = server.id;
    this.req = {};
    this.server = server;
    var that = this;
    server.socket.on('drone started', function (data) {
        console.log('drone started response');
        console.log(data);
        var req = that.req[data.id];
        if (!req) {
            return;
        }
        console.log('request found');
        var domain = req.domain;
        var dom = domains[domain.id] || (domains[domain.id] = {
            domain: domain,
            drones: []
        });
        dom.drones.push({
            ip: server.ip,
            port: data.port
        });
        /*var name = domain.name;
         if (name.indexOf('*.') === -1) {
         server.socket.emit('domain drones', domains[name.substring(2)] || []);
         }*/
        delete that.req[data.id];
        delete data.id;
        req.cb(false, data);
        console.log('firing fireDrones');
        fireDrones(servers);
    });
    server.socket.on('drone error', function (data) {
        console.log('drone error');
    });
    server.socket.on('drone stopped', function (data) {
        console.log('drone stopped');
    });
    /*server.socket.on('domain drone list', function (data) {
     console.log(data);
     console.log('drone started response');
     console.log(data);
     var req = that.req[data.id];
     if (!req) {
     return;
     }
     console.log('request found');
     var domain = req.domain;
     var dom = domains[domain.id];
     server.socket.emit('domain drone listed', drones);
     });*/
};

Server.prototype.startDrone = function (domain, cb) {
    var that = this;
    console.log('starting drone');
    Domain.findOne({
        _id: domain
    }).exec(function (err, domain) {
        if (err) {
            console.log(err);
            //TODO: send proper HTTP code
            cb(true, 404);
            return;
        }
        console.log('firing start drone event');
        var id = uuid.v4();
        that.req[id] = {
            domain: domain,
            cb: cb
        };
        console.log(domain);
        that.server.socket.emit('drone start', {
            id: id,
            repo: domain.repo,
            domain: domain.name
        });
        console.log('drone start event fired');
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
