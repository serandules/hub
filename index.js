var log = require('logger')('hub');

var configs = require('hub-configs');

var fs = require('fs');
var uuid = require('node-uuid');
var https = require('https');
var express = require('express');
var io = require('socket.io');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var builder = require('component-middleware');
var auth = require('./lib/auth');
var procevent = require('procevent');
var utils = require('utils');
var build = require('build');

var databases = require('./lib/databases');
var hub = require('./lib/hub');

var prod = utils.prod();

var options = {
    key: fs.readFileSync(configs.ssl.key),
    cert: fs.readFileSync(configs.ssl.cert),
    ca: [fs.readFileSync(configs.ssl.ca)],
    requestCert: true,
    rejectUnauthorized: false
};

auth = auth({
    open: [
        '^(?!\\/apis(\\/|$)).+',
        '^\/apis\/v\/tokens$',
        '^\/apis\/v\/vehicles$',
        '^\/apis\/v\/configs\/boot$',
        '^\/apis\/v\/menus\/.*$'
    ],
    hybrid: [
        '^\/apis\/v\/tokens\/.*'
    ]
});

var socouth = function (socket, next) {
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

var index = fs.readFileSync(__dirname + '/public/index.html', 'utf-8');

var app = express();

app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use('/public', express.static(__dirname + '/public'));

app.use(auth);

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

//token apis
app.use('/apis/v', require('./apis/tokens'));
app.use('/apis/v', require('./apis/users'));

app.use('/apis/v', require('./apis/menus'));
app.use('/apis/v', require('./apis/servers'));
app.use('/apis/v', require('./apis/domains'));
app.use('/apis/v', require('./apis/configs'));
app.use('/apis/v', require('./apis/drones'));
app.use('/apis/v', require('./apis/hub'));

app.use('/apis/v/serand', require('./apis/serand/configs'));

if (prod) {
    log.info('building components during startup');
    build();
} else {
    log.info('hot component building with express middleware');
    app.use(builder({
        path: '/public/build'
    }));
}
//index page
app.all('*', function (req, res) {
    //TODO: check caching headers
    res.set('Content-Type', 'text/html').status(200).send(index);
});

var server = https.createServer(options, app);

io = io(server);

var db = databases.hub;
db.on('error', log.error.bind(log, 'connection error:'));

db.once('open', function callback() {
    log.info('connected to mongodb : %s', 'hub');

    hub.listenServers(io.of('/servers').use(socouth));
    hub.listenDrones(io.of('/drones').use(socouth));
    hub.listenConfigs(io.of('/configs').use(socouth));

    server.listen(configs.port, function () {
        var address = server.address();
        procevent = procevent(process);
        procevent.emit('started', address.port);
        procevent.destroy();
        log.debug(JSON.stringify(address));
        log.info('hub started | url:https://%s:%s', configs.domain, address.port);
    });
});

process.on('uncaughtException', function (err) {
    log.fatal('unhandled exception %s', err);
    log.trace(err);
});
