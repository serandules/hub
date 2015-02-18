var log = require('logger')('hub');
var clustor = require('clustor');

var configs = require('hub-configs');

clustor(configs.domain, function () {
    var fs = require('fs');
    var https = require('https');
    var express = require('express');
    var io = require('socket.io');

    var options = {
        key: fs.readFileSync(configs.ssl.key),
        cert: fs.readFileSync(configs.ssl.cert),
        ca: [fs.readFileSync(configs.ssl.ca)],
        requestCert: true,
        rejectUnauthorized: false
    };

    var app = express();

    app.use('/apis/v', require('./apis/servers'));
    app.use('/apis/v', require('./apis/domains'));
    app.use('/apis/v', require('./apis/configs'));
    app.use('/apis/v', require('./apis/drones'));

    var server = https.createServer(options, app);
    io = io(server);
    var drones = io.of('/drones').on('connection', function (socket) {
        log.info('client connected to /drones');
        socket.emit('join', {
            hello: 'world'
        });
    });
    drones.use(function (socket, next) {
        var query = socket.handshake.query;
        var token = query.token;
        if (!token) {
            return next('hub-client token not found');
        }
        if (configs.token !== token) {
            return next('unauthorized hub-client');
        }
        next();
    });
    server.listen(configs.port);

}, function (err, address) {
    log.info(JSON.stringify(address));
    log.info('%s listening at https://%s:%s', configs.domain, address.address, address.port);
});