var socket = require('./socket');
var express = require('express');
var app = module.exports = express();

app.get('/servers', function (req, res) {
    res.send(servers(socket.servers()));
});

app.get('/servers/:id', function (req, res) {
    var id = req.params.id;
    res.send(socket.servers(id));
});

var servers = function (servers) {
    var servs = [];
    servers.forEach(function (serv) {
        servs.push({
            id: serv.id,
            ip: serv.ip
        });
    });
    return servs;
};