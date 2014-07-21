var uuid = require('node-uuid');
var io = require('socket.io');

var servers = [];
var browsers = [];

var plugins = {
    hub: require('../plugins/hub')
};

var process = function (socket, options) {
    var plugin = plugins[options.plugin];
    if (!plugin) {
        console.err('unknown plugin');
        return;
    }
    plugin(socket, options);
};

var connect = function (socket) {
    var ip = socket.client.request.socket.remoteAddress;
    console.log('connected : ' + ip);
    var id = uuid.v4();
    socket.toJSON = function () {
        return undefined;
    };
    servers.push({
        id: id,
        ip: ip,
        socket: socket
    });
};

var disconnect = function (socket) {
    var i, length = servers.length;
    for (i = 0; i < length; i++) {
        if (servers[i].socket === socket) {
            servers.splice(i, 1);
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

module.exports.listen = function (server) {
    io = io(server);
    io.of('/hub').on('connection', function (socket) {
        connect(socket);
        socket.on('servers', function (options) {
            console.log('servers event');
            console.log(servers);
            socket.emit('servers', servers);
        });
        socket.on('exec', function (data) {
            console.log('plugin exec request');
            process(socket, data);
        });
        socket.on('disconnect', function () {
            disconnect(socket);
            console.log('disconnected');
        });
    });

    io.of('/app').on('connection', function (socket) {
        var ip = socket.client.request.socket.remoteAddress;
        console.log('connected : ' + ip);
        socket.on('servers', function (options) {
            console.log('servers event');
            console.log(servers);
            socket.emit('servers', servers);
        });
        socket.on('disconnect', function () {
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
    if (!id) {
        return servers;
    }
    return find(function (serv) {
        return serv.id === id;
    });
};
