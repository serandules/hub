var client = require('./ws/client');
var express = require('express');
var app = module.exports = express();

app.get('/clients', function (req, res) {
    var id = req.params.id;
    res.send({
        home: { url: '/', title: 'serandives.com'},
        menu: [
            { url: '/domains', title: 'Domains' },
            { url: 'https://auto.serandives.com', title: 'Drones' },
            { url: 'https://hotels.serandives.com', title: 'Hotels' },
            { url: 'https://jobs.serandives.com', title: 'Jobs' }
        ]
    });
});