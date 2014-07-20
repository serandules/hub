var fs = require('fs');
var https = require('https');
var uuid = require('node-uuid');
var ws = require('ws');
var build = require('build');
var express = require('express');
var mongoose = require('mongoose');
var auth = require('auth');

var str = JSON.stringify;
var pas = JSON.parse;

var mongourl = 'mongodb://localhost/hub';
var HTTP_PORT = 4000;
var app = express();

var options = {
    key: fs.readFileSync('ssl/hub.key'),
    cert: fs.readFileSync('ssl/hub.cert')
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

var index = fs.readFileSync('./public/index.html', 'utf-8');

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
    app.use('/apis/v', require('./lib/domain'));

    var wss = new ws.Server({
        server: server
    });

    var clients = [];
    wss.on('connection', function (socket) {
        console.log('connected');
        clients.push(socket);
        socket.on('message', function (o) {
            o = pas(o);
            console.log(o.data.data);
        });
        socket.on('disconnect', function () {
            console.log('disconnected');
        });
    });

    app.get('/wss', function (req, res) {
        console.log(req.query.data);
        var data = pas(req.query.data);
        data.id = uuid.v4();
        clients.forEach(function (client) {
            client.send(str(data));
        });
        res.send('done');
    });

    //hot component building
    //app.use(build);

    //index page
    app.all('*', function (req, res) {
        //TODO: check caching headers
        res.set('Content-Type', 'text/html').send(200, index);
    });

    server.listen(HTTP_PORT);
    console.log('listening on port ' + HTTP_PORT);
});