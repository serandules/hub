var log = require('logger')('hub:apis:domains');
var express = require('express');
var router = express.Router();

var Domain = require('../lib/domain');
var server = require('../lib/server');

module.exports = router;

router.get('/domains', function (req, res) {
    Domain.find({}).exec(function (err, domains) {
        res.send(domains);
    });
});

router.get('/domains/:id', function (req, res) {
    Domain.findOne({
        _id: req.params.id
    }).exec(function (err, domain) {
        res.send(domain);
    });
});

router.post('/domains/:id/restart', function (req, res) {
    server.restartDomain(req.params.id, function (err) {
        res.send({
            error: false
        });
    });
});

router.post('/domains', function (req, res) {
    Domain.create(req.body, function (err, domain) {
        res.send(domain);
    });
});

router.delete('/domains/:id', function (req, res) {
    Domain.findOne({
        _id: req.params.id
    }).exec(function (err, domain) {
        domain.remove();
        res.send({
            error: false
        });
    });
});