var uuid = require('node-uuid');
var socproc = require('socproc');
var Domain = require('./domain').model;
var Config = require('./config').model;

var TOKEN = process.env.CLIENT_TOKEN;

var planKey = 'plan';

if (!TOKEN) {
    throw 'hub-client token cannot be found. Please specify it with CLIENT_TOKEN property';
}

var restart = (process.argv && process.argv.indexOf('restart') !== -1);

var servers = {};
var domains = {};
var drones = {};
var activePlan;

var joinDrone = function (server, domain, drone) {
    console.log(drone);
    if (!server || !domain) {
        console.log('ignoring event as server or domain is null');
        return;
    }
    console.log('joinDrone server:' + server.id + ' domain:' + domain.id);
    drone.ip = server.server.ip;
    server.drones.push(drone);
    domain.drones.push(drone);
    drones[drone.id] = {
        server: server,
        domain: domain
    };
    server.server.socket.emit('drones init', {
        at: new Date().getTime(),
        drone: drone.id,
        domains: domains
    });
    var id;
    for (id in servers) {
        if (servers.hasOwnProperty(id)) {
            servers[id].server.socket.emit('drone joined', {
                at: new Date().getTime(),
                id: drone.id,
                domain: domain.name,
                ip: drone.ip,
                port: drone.port
            });
        }
    }
    console.log('fired:drone joined');
};

var leaveDrone = function (server, domain, drone) {
    console.log(drone);
    if (!server || !domain) {
        console.log('ignoring event as server or domain is null');
        return;
    }
    console.log('leaveDrone server:' + server.id + ' domain:' + domain.id);
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
    server.server.socket.emit('drone left', {
        at: new Date().getTime(),
        id: drone.id,
        domain: domain.name
    });
    console.log('fired:drone left');
    delete drones[drone.id];
};

var syncPlan = function (plan) {
    var ip;
    for (ip in activePlan) {
        if (activePlan.hasOwnProperty(ip)) {
            plan[ip].restart = activePlan[ip].restart;
        }
    }
    activePlan = plan;
    return plan;
};

var plan = function (data, cb) {
    if (!cb) {
        cb = data;
        Config.findOne({
            name: planKey
        }).exec(function (err, config) {
            if (err) {
                return cb(err);
            }
            cb(false, config ? JSON.parse(config.value) : {});
        });
        return;
    }
    Config.findOne({
        name: planKey
    }).exec(function (err, config) {
        if (err || !config) {
            Config.create({
                name: planKey,
                value: JSON.stringify(data)
            }, function (err, config) {
                if (err) {
                    console.error('error while saving config : ' + planKey);
                    return cb(err);
                }
                cb(false, syncPlan(data));
            });
            return;
        }
        Config.update({
            _id: config.id
        }, {
            value: JSON.stringify(data)
        }, function (err, config) {
            if (err) {
                console.error('error while updating config : ' + planKey);
                return cb(err);
            }
            cb(false, syncPlan(data));
        });
    });
};
module.exports.plan = plan;

var initClient = function (serv) {
    plan(function (err, plan) {
        var drones = plan[serv.server.ip];
        if (!drones) {
            return;
        }
        drones.forEach(function (domain) {
            serv.startDrone(domain, function (err, data) {
                console.log('drone started');
                console.log(data);
                serv.server.socket.emit('drone started', data);
            });
        });
    });
};

var droneServer = function (drone) {
    drone = drones[drone.id];
    return drone ? drone.server : null;
};
module.exports.droneServer = droneServer;

var droneDomain = function (drone) {
    drone = drones[drone.id];
    return drone ? drone.domain : null;
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
                id: domain.id,
                name: domain.name,
                drones: []
            });
        joinDrone(that, dom, data);
        delete that.req[data.id];
        req.cb(false, data);
    });
    server.socket.on('drone error', function (data) {
        console.log('drone error');
    });
    server.socket.on('drone stopped', function (data) {
        console.log('event:drone stopped');
        leaveDrone(that, droneDomain(data), data);
    });
    server.socket.on('self drones', function (data) {
        console.log('event:self drones');
        console.log(data);
        var name;
        for (name in data) {
            if (data.hasOwnProperty(name)) {
                Domain.findOne({
                    name: name
                }).exec(function (err, domain) {
                    var dom = domains[domain.id] || (domains[domain.id] = {
                            id: domain.id,
                            name: domain.name,
                            drones: []
                        });
                    var drns = data[domain.name];
                    if (!drns) {
                        return;
                    }
                    drns.forEach(function (drn) {
                        joinDrone(that, dom, drn);
                    });
                });
            }
        }
    });
    server.socket.on('drone config', function (data) {
        console.log('even:drone config id:' + data.id + ' name:' + data.name);
        Config.findOne({
            name: data.name
        }).exec(function (err, config) {
            server.socket.emit('drone configed', {
                id: data.id,
                value: (err || !config) ? null : config.value
            });
        });
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

var listen = function (io) {
    var sps = socproc('server', io);
    sps.use(function (socket, next) {
        var query = socket.handshake.query;
        var token = query.token;
        if (!token) {
            return next('hub-client token not found');
        }
        if (token !== TOKEN) {
            return next('unauthorized hub-client');
        }
        next();
    });
    sps.on('connection', function (server) {
        console.log('event:connection server:' + server.id);
        var serv = new Server(server);
        servers[server.id] = serv;
        var svr = activePlan[serv.server.ip];
        if (!svr || !svr.restart) {
            return initClient(serv);
        }
        svr.restart = false;
    });
    sps.on('disconnect', function (server) {
        console.log('event:disconnect server:' + server.id);
        server = servers[server.id];
        console.log(server.drones);
        var drones = server.drones;
        var i, drone;
        var length = drones.length;
        for (i = length - 1; i >= 0; i--) {
            drone = drones[i];
            if (drone) {
                leaveDrone(server, droneDomain(drone), drone);
            }
        }
        delete servers[server.id];
    });
};

module.exports.listen = function (io) {
    plan(function (err, plan) {
        activePlan = plan;
        if (!restart) {
            return listen(io);
        }
        var ip;
        for (ip in plan) {
            if (plan.hasOwnProperty(ip)) {
                plan[ip].restart = true;
            }
        }
        listen(io);
    });
};

module.exports.servers = function (id) {
    return id ? servers[id] : servers;
};

module.exports.domains = function (id) {
    return id ? domains[id] : domains;
};