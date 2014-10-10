var express = require('express');
var app = module.exports = express();

app.get('/menus/:id', function (req, res) {
    var id = req.params.id;
    res.send({
        home: { url: '/', title: 'serandives.com'},
        menu: [
            { url: '/hub', title: 'Hub' },
            { url: '/domains', title: 'Domains' },
            { url: '/configs', title: 'Configs' }
        ]
    });
});