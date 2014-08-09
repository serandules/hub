var https = require('https');
var express = require('express');
var io = require('socket.io');
var fs = require('fs');
var constants = require('constants');
var socproc = require('socproc');

var HTTP_PORT = 4000;
var app = express();

var options = {
    key: fs.readFileSync('ssl/hub.key'),
    cert: fs.readFileSync('ssl/hub.cert')
};

var server = https.createServer(options, app);

io = io(server);

server.listen(function() {
    var address = server.address();
    console.log("opened server on %j", address);
});
console.log('listening on port ' + HTTP_PORT);

var sps = socproc('server', io);
sps.on('connection', function (client) {
    console.log('connected client');
    client.spawn('bash', null , null, function (err, child) {
        child.stdout.on('data', function (data) {
            console.log(data);
        });
        child.exec('ls -alh');
        child.exec('git status');
        child.exec('git branch');
        //child.exec('git commit -am "adding socproc"');
        //child.exec('git push');
    });
});

/*io.on('connection', function (socket) {
 console.log('connected');
 socket.emit('news', { hello: 'world' });
 socket.on('my other event', function (data) {
 console.log(data);
 });
 });*/
/*
 var wss = new ws.Server({
 server: server
 });

 wss.on('connection', function (socket) {
 console.log('connected');
 });*/
