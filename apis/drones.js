var log = require('logger')('hub:apis:drones');
var express = require('express');
var router = express.Router();

var Domain = require('../lib/domain');
var server = require('../lib/server');

module.exports = router;

router.post('/drones', function (req, res) {
    var data = req.body;
    var serv = server.servers(data.server);
    serv.start(data.domain, function (err, id, ip, port) {
        log.debug('drone started id:%s, ip:%s, port:%s', id, ip, port);
    });
    res.send({
        error: false
    });
});

router.get('/drones/:id', function (req, res) {
    var drone = server.drone(req.params.id);
    if (!drone) {
        return res.status(404).send({
            error: 'drone cannot be found'
        });
    }
    res.send({
        id: drone.id,
        ip: drone.ip,
        port: drone.port
    });
});

router.get('/drones', function (req, res) {
    var drones = server.drones(req.query.domain);
    var dronez = [];
    drones.forEach(function (drone) {
        dronez.push({
            id: drone.id,
            ip: drone.ip,
            port: drone.port
        });
    });
    res.send(dronez);
});

router.delete('/drones/:id', function (req, res) {
    server.removeDrone(req.params.id);
    res.send({
        error: false
    });
});