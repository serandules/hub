var log = require('logger')('hub');

var configs = require('hub-configs');

var fs = require('fs');
var uuid = require('node-uuid');
var https = require('https');
var express = require('express');
var mongoose = require('mongoose');
var io = require('socket.io');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');

var serv = require('./lib/server');

var drone = require('./lib/drone');

var mongourl = 'mongodb://localhost/hub';

var options = {
    key: fs.readFileSync(configs.ssl.key),
    cert: fs.readFileSync(configs.ssl.cert),
    ca: [fs.readFileSync(configs.ssl.ca)],
    requestCert: true,
    rejectUnauthorized: false
};

var auth = function (socket, next) {
    var query = socket.handshake.query;
    var token = query.token;
    if (!token) {
        return next('client token not found');
    }
    if (configs.token !== token) {
        return next('unauthorized client');
    }
    next();
};

var app = express();

app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use('/public', express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use('/apis/v', require('./apis/servers'));
app.use('/apis/v', require('./apis/domains'));
app.use('/apis/v', require('./apis/configs'));
app.use('/apis/v', require('./apis/drones'));

var server = https.createServer(options, app);

io = io(server);

mongoose.connect(mongourl);

var db = mongoose.connection;
db.on('error', log.error.bind(log, 'connection error:'));

db.once('open', function callback() {
    log.info('connected to mongodb : ' + mongourl);

    serv.listen(io.of('/servers').use(auth));
    drone.listen(io.of('/drones').use(auth));

    server.listen(configs.port, function () {
        var address = server.address();
        log.info(JSON.stringify(address));
        log.info('hub started | url:https://%s:%s', configs.domain, address.port);
    });
});

process.on('uncaughtException', function (err) {
    log.fatal('unhandled exception %s', err);
    log.trace(err.stack);
});