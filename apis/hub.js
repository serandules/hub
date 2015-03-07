var log = require('logger')('hub:apis:hub');
var express = require('express');
var hub = require('../lib/hub');
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
            break;
        default:
            break;
    }
    log.info('hubclient restart request');
    res.send({
        error: false
    });
});