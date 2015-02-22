var express = require('express');
var router = express.Router();

var Domain = require('../lib/domain');
var server = require('../lib/server');


router.get('/servers', function (req, res) {
    var servers = server.servers();
    var servs = [];
    var agen;
    var id;
    for (id in servers) {
        if (servers.hasOwnProperty(id)) {
            agen = servers[id];
            servs.push({
                id: agen.id,
                ip: agen.ip
            });
        }
    }
    res.send(servs);
});

router.get('/servers/:id', function (req, res) {
    var serv = server.servers(req.params.id);
    res.send({
        id: serv.id,
        ip: serv.ip
    });
});

router.get('/servers/:id/drones', function (req, res) {
    var serv = req.params.id;
    var dronz = server.drones(req.params.id);
    var drones = [];
    var dron;
    var id;
    for (id in dronz) {
        if (dronz.hasOwnProperty(id)) {
            dron = dronz[id];
            drones.push({
                server: serv,
                id: dron.id,
                ip: dron.ip,
                port: dron.port
            });
        }
    }
    res.send(drones);
});

module.exports = router;