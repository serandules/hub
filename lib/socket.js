var uuid = require('node-uuid');
var io = require('socket.io');

var mids = [];
var servers = [];
var browsers = [];

var process = function (socket, options) {
    mids.every(function (mid) {
        var next = false;
        mid(socket, options, function (err) {
            if (!err) {
                next = true;
            }
        });
        return next;
    });
};

var use = function (mid) {
    mids.push(mid);
};

//use(require('./ws/hub').serve);

module.exports = function (server) {
    io = io(server);
    io.of('/hub').on('connection', function(socket) {
        var ip = socket.client.request.socket.remoteAddress;
        console.log('connected : ' + ip);
        servers.push({
            id: uuid.v4(),
            ip: ip
        });
        socket.on('servers', function(options) {
            console.log('servers event');
            console.log(servers);
            socket.emit('servers', servers);
        });
        socket.on('disconnect', function() {
           console.log('disconnected');
        });
    });

    io.of('/app').on('connection', function(socket) {
        var ip = socket.client.request.socket.remoteAddress;
        console.log('connected : ' + ip);
        socket.on('servers', function(options) {
            console.log('servers event');
            console.log(servers);
            socket.emit('servers', servers);
        });
        socket.on('disconnect', function() {
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

module.exports.servers = function(callback) {
    callback(false, servers);
};
