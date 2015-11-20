var log = require('logger')('hub:apis:configs');
var express = require('express');
var router = express.Router();
var Config = require('config');

module.exports = router;

router.get('/configs', function (req, res) {
    Config.find({}).exec(function (err, configs) {
        if (err) {
            //TODO: send proper HTTP code
            log.error('config find error: %e', err);
            return res.status(500).send({
                error: true
            });
        }
        res.send(configs);
    });
});

router.get('/configs/:name', function (req, res) {
    Config.findOne({
        name: req.params.name
    }).exec(function (err, config) {
        if (err) {
            //TODO: send proper HTTP code
            log.error('config find error: %e', err);
            return res.status(500).send({
                error: true
            });
        }
        if (!config) {
            return res.status(404).send({
                error: true
            });
        }
        res.send(config);
    });
});

router.delete('/configs/:name', function (req, res) {
    Config.findOne({
        name: req.params.name
    }).exec(function (err, config) {
        if (err) {
            //TODO: send proper HTTP code
            log.error('config find error: %e', err);
            return res.status(500).send({
                error: true
            });
        }
        if (!config) {
            return res.status(404).send({
                error: true
            });
        }
        config.remove();
        res.send({
            error: false
        });
    });
});

router.post('/configs', function (req, res) {
    Config.create(req.body, function (err, config) {
        if (err) {
            log.error('config find error: %e', err);
            return res.status(500).send({
                error: true
            });
        }
        res.send(config);
    });
});