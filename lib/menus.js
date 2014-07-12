var express = require('express');
var app = module.exports = express();

app.get('/menus/:id', function (req, res) {
    res.send({
        home: { url: '/', title: 'serandives.com'},
        menu: [
            { url: 'https://accounts.serandives.com', title: 'Accounts' },
            { url: 'https://auto.serandives.com', title: 'Auto' },
            { url: 'https://hotels.serandives.com', title: 'Hotels' },
            { url: 'https://jobs.serandives.com', title: 'Jobs' }
        ]
    });
});