var log = require('logger')('hub:apis:drones');
var express = require('express');
var router = express.Router();

var Domain = require('../lib/domain');
var server = require('../lib/server');

module.exports = router;

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
                id: dron.id,
                ip: dron.ip,
                port: dron.port
            });
        }
    }
    res.send(drones);
});

router.get('/servers/:server/drones/:id', function (req, res) {
    var drone = server.drones(req.params.server, req.params.id);
    res.send({
        id: drone.id,
        ip: drone.ip,
        port: drone.port
    });
});

router.post('/servers/:id/drones', function (req, res) {
    var data = req.body;
    var serv = server.servers(req.params.id);
    Domain.findOne({
        _id: data.domain
    }).exec(function (err, domain) {
        serv.start(domain.repo, function (err, id, ip, port) {
            res.send({
                id: id,
                ip: ip,
                port: port
            });
        });
    });
});