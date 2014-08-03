var uuid = require('node-uuid');
var io = require('socket.io');
var socproc = require('socproc');

var hub = require('../plugins/hub');

var plugins = [
    hub
];

/*var connect = function (socket, conns) {
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

var connServ = function (server) {
    console.log('connected client');
    servers.push(server);
    server.spawn('bash', null, null, function (err, child) {
        child.stdout.on('data', function (data) {
            console.log(data);
        });
        child.exec('ls -alh');
        child.exec('git status');
        child.exec('git branch');
        //child.exec('git commit -am "adding socproc"');
        //child.exec('git push');
    });
};

var disconServ = function (server) {
    var i, length = servers.length;
    for (i = 0; i < length; i++) {
        if (servers[i] === server) {
            servers.splice(i, 1);
            break;
        }
    }
};*/

/*var find = function (servers, fn) {
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

var byId = function (servers, id) {
    return find(servers, function (serv) {
        return serv.id === id;
    });
};

var bySocket = function (socket) {
    return find(function (serv) {
        return serv.socket === socket;
    });
};*/


module.exports.listen = function (server) {
    io = io(server);
    var sps = socproc('server', io);
    /*sps.on('connection', function (client) {
        connServ(client);
    });

    sps.on('disconnect', function (client) {
        disconServ(client);
    });*/

    var app = io.of('/app');
    /*app.on('connection', function (socket) {
        var ip = socket.client.request.socket.remoteAddress;
        console.log('connected : ' + ip);
        connect(socket, apps);
        socket.on('drone start', function (options) {
            console.log('plugin do request');
            process(options, function (options) {
                socket.emit('done', options);
            });
        });
        *//*socket.on('done', function (options) {
         console.log('plugin done request');
         process(socket, options);
         });*//*
        socket.on('disconnect', function () {
            disconnect(socket, apps);
            console.log('disconnected');
        });
    });*/

    plugins.forEach(function (plugin) {
        plugin(sps, app);
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
    return hub.servers(id);
};

/*module.exports.apps = function (id) {
 return id ? byId(apps, id) : apps;
 };

 var waits = [];

 module.exports.exec = function(data, fn, sid) {
 var id = uuid.v4();
 var server = servers[sid];
 waits.push(fn);
 server.socket.emit({
 id: id,
 data: data
 });
 server.socket.once(id, function(data) {
 fn(data);
 });
 }*/
