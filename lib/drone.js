var debug = require('debug')('serandules:hub');
var utils = require('utils');
var express = require('express');
var app = module.exports = express();

var paging = {
    start: 0,
    count: 1000,
    sort: ''
};

var fields = {
    '*': true
};

var clean = function (data) {

};

app.get('/drones', function (req, res) {
    var data = req.query.data ? JSON.parse(req.query.data) : {};
    clean(data.criteria || (data.criteria = {}));
    utils.merge(data.paging || (data.paging = {}), paging);
    utils.merge(data.fields || (data.fields = {}), fields);
    res.send([
        {
            ip: '10.0.0.1',
            port: 4000,
            status: {
                active: true,
                load: 0.6
            }
        },
        {
            ip: '10.0.0.1',
            port: 4002,
            status: {
                active: true,
                load: 0.6
            }
        }
    ]);
});