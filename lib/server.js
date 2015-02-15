var debug = require('debug')('serandules:hub');
var hub = require('./hub');
var express = require('express');
var app = module.exports = express();

app.get('/servers', function (req, res) {
    var id;
    var serv;
    var servs = [];
    var servers = hub.servers();
    for (id in servers) {
        if (servers.hasOwnProperty(id)) {
            serv = servers[id];
            servs.push({
                id: id,
                ip: serv.ip
            });
        }
    }
    res.send(servs);
});

app.get('/servers/:id', function (req, res) {
    var id = req.params.id;
    res.send(hub.servers(id));
});