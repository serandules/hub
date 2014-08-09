var hub = require('./hub');
var express = require('express');
var app = module.exports = express();

app.get('/servers', function (req, res) {
    res.send(hub.servers());
});

app.get('/servers/:id', function (req, res) {
    var id = req.params.id;
    res.send(hub.servers(id));
});