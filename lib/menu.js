var express = require('express');
var app = module.exports = express();

app.get('/menus/:id', function (req, res) {
    var id = req.params.id;
    res.send({
        home: { url: '/', title: 'serandives.com'},
        menu: [
            { url: '/servers', title: 'Servers' },
            { url: '/domains', title: 'Domains' }
        ]
    });
});