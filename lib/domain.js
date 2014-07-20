var express = require('express');
var app = module.exports = express();

app.get('/domains', function (req, res) {
    res.send([
        {
            cname: 'auto.serandives.com'
        },
        {
            cname: 'hub.serandives.com'
        }
    ]);
});