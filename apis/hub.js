var log = require('logger')('hub:apis:hub');
var express = require('express');
var hub = require('../lib/hub');
var server = require('../lib/hub');
var client = require('../lib/client');
var router = express.Router();

module.exports = router;

router.post('/hub/self/:action', function (req, res) {
    var action = req.params.action;
    switch (action) {
        case 'up':
            hub.up();
            res.send({
                error: false
            });
            break;
        default:
            log.debug('invalid self request:%s', action);
            res.status(404).send({
                error: 'invalid action'
            });
            break;
    }
});

router.post('/hub/client/:action', function (req, res) {
    var action = req.params.action;
    switch (action) {
        case 'up':
            client.up();
            res.send({
                error: false
            });
            break;
        default:
            log.debug('invalid client request:%s', action);
            res.status(404).send({
                error: 'invalid action'
            });
            break;
    }
});

router.post('/hub/plan', function (req, res) {
    hub.savePlan(function (err) {
        if (err) {
            return res.status(500).send({
                error: err
            });
        }
        res.send({
            error: false
        });
    });
});

router.delete('/hub/plan', function (req, res) {
    hub.removePlan(function (err) {
        if (err) {
            return res.status(500).send({
                error: err
            });
        }
        res.send({
            error: false
        });
    });
});