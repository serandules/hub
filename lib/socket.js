var uuid = require('node-uuid');
var io = require('socket.io');

var servers = [];
var apps = [];

var plugins = {
    hub: require('../plugins/hub'),
    sh: require('../plugins/sh')
};

var process = function (server, options) {
    var name = options.plugin;
    var plugin = plugins[name];
    if (!plugin) {
        console.error('unknown plugin');
        return;
    }
    plugin(function (data) {
        data.plugin = name;
        server.socket.emit('exec', data);
    }, options);
};

var connect= function (socket, conns) {
    var ip = socket.client.request.socket.remoteAddress;
    var id = uuid.v4();
    console.log('connected server : ' + ip + ' as ' + id);
    socket.toJSON = function () {
        return undefined;
    };
    conns.push({
        id: id,
        ip: ip,
        socket: socket
    });
};

var disconnect = function (socket, conns) {
    var i, length = conns.length;
    for (i = 0; i < length; i++) {
        if (conns[i].socket === socket) {
            conns.splice(i, 1);
            break;
        }
    }
};

var find = function (fn) {
    var server = null;
    servers.every(function (serv) {
        if (!fn(serv)) {
            return true;
        }
        server = serv;
        return false;
    });
    return server;
};

var byId = function (id) {
    return find(function (serv) {
        return serv.id === id;
    });
};

var bySocket = function (socket) {
    return find(function (serv) {
        return serv.socket === socket;
    });
};


module.exports.listen = function (server) {
    io = io(server);
    io.of('/hub').on('connection', function (socket) {
        connect(socket, servers);
        socket.on('exec', function (data) {
            process(bySocket(socket), data);
        });
        socket.on('disconnect', function () {
            disconnect(socket, servers);
            console.log('disconnected');
        });
    });

    io.of('/app').on('connection', function (socket) {
        var ip = socket.client.request.socket.remoteAddress;
        console.log('connected : ' + ip);
        connect(socket, apps);
        socket.on('servers', function (options) {
            console.log('servers event');
            socket.emit('servers', servers);
        });
        socket.on('exec', function (data) {
            console.log('plugin exec request');
            process(byId(data.id), data);
        });
        socket.on('disconnect', function () {
            disconnect(socket, apps);
            console.log('disconnected');
        });
    });

    /*wss.on('headers', function (headers) {
     console.log(headers);
     });
     wss.on('connection', function (socket) {
     var headers = socket.upgradeReq.headers;
     var agent = headers['user-agent'];
     //agent === 'hub-client' ? clients.push(socket) : browsers.push(socket);
     console.log(agent);
     console.log('connected');
     socket.on('message', function (o) {
     try {
     process(socket, pas(o));
     } catch (e) {
     console.error(e);
     }
     });
     socket.on('disconnect', function () {
     console.log('disconnected');
     });
     });*/
};

module.exports.servers = function (id) {
    return id ? byId(id) : servers;
};
