var express = require('express');
var router = express.Router();

var hub = require('../lib/hub');

module.exports = router;

router.get('/servers', function (req, res) {
    var servers = hub.servers();
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
    var serv = hub.servers(req.params.id);
    res.send({
        id: serv.id,
        ip: serv.ip
    });
});