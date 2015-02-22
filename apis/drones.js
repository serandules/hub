var log = require('logger')('hub:apis:drones');
var express = require('express');
var router = express.Router();

var Domain = require('../lib/domain');
var server = require('../lib/server');

router.get('/drones/:id', function (req, res) {
    var drone = server.drone(req.params.id);
    res.send({
        server: drone.server.id,
        id: drone.id,
        ip: drone.ip,
        port: drone.port
    });
});

router.post('/drones', function (req, res) {
    var data = req.body;
    var serv = server.servers(data.server);
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

module.exports = router;