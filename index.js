var fs = require('fs');
var https = require('https');
var uuid = require('node-uuid');
var build = require('build');
var io = require('socket.io');
var express = require('express');
var mongoose = require('mongoose');
var auth = require('auth');

var hub = require('./lib/hub');
var ap = require('./lib/app');

var mongourl = 'mongodb://localhost/hub';
var HTTP_PORT = 4000;
var app = express();

var options = {
    key: fs.readFileSync('/etc/ssl/serand/hub.key'),
    cert: fs.readFileSync('/etc/ssl/serand/hub.cert')
};

var server = https.createServer(options, app);

auth = auth({
    open: [
        '^(?!\\/apis(\\/|$)).+',
        '^\/apis\/v\/tokens([\/].*|$)',
        '^\/apis\/v\/vehicles$',
        '^\/apis\/v\/menus\/.*$'
    ]
});

var index = fs.readFileSync(__dirname + '/public/index.html', 'utf-8');

mongoose.connect(mongourl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log('connected to mongodb : ' + mongourl);

    app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
    app.use('/public', express.static(__dirname + '/public'));

    //auth header loading
    app.use(auth);

    app.use(express.json());
    app.use(express.urlencoded());

    //token apis
    app.use('/apis/v', require('token-service'));
    app.use('/apis/v', require('user-service'));
    //menu apis
    app.use('/apis/v', require('./lib/menu'));
    //drones apis
    app.use('/apis/v', require('./lib/drone'));
    //domains apis
    app.use('/apis/v', require('./lib/domain').app);
    //servers apis
    app.use('/apis/v', require('./lib/server'));

    io = io(server);
    hub.listen(io);
    ap.listen(io);

    /*app.get('/wss', function (req, res) {
     console.log(req.query.data);
     var data = JSON.parse(req.query.data);
     data.id = uuid.v4();
     clients.forEach(function (client) {
     client.send(str(data));
     });
     res.send('done');
     });*/

    //hot component building
    app.use(build);

    //index page
    app.all('*', function (req, res) {
        //TODO: check caching headers
        res.set('Content-Type', 'text/html').send(200, index);
    });

    server.listen(HTTP_PORT);
    console.log('listening on port ' + HTTP_PORT);
});

process.on('uncaughtException', function (err) {
    console.log('unhandled exception ' + err);
    console.trace(err.stack);
});