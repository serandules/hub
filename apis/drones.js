var log = require('logger')('hub:apis:drones');
var express = require('express');
var router = express.Router();

var Domain = require('../lib/domain');
var hub = require('../lib/hub');

module.exports = router;

router.post('/drones', function (req, res) {
    var data = req.body;
    hub.startDrone(data.server, data.domain);
    res.send({
        error: false
    });
});

router.get('/drones/:id', function (req, res) {
    var drone = hub.drone(req.params.id);
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
    var drones = hub.drones(req.query.domain);
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
    hub.stopDrone(req.params.id);
    res.send({
        error: false
    });
});