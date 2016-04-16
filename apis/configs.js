var log = require('logger')('hub:apis:configs');
var express = require('express');
var router = express.Router();
var Config = require('../models/config');

module.exports = router;

var stringify = function (configs) {
    var o = Array.isArray(configs) ? configs : [configs];
    o.forEach(function (config) {
        config.value = JSON.stringify(config.value);
    });
    return configs;
};

var parse = function (configs) {
    var o = Array.isArray(configs) ? configs : [configs];
    o.forEach(function (config) {
        config.value = JSON.parse(config.value);
    });
    return configs;
};

router.get('/configs', function (req, res) {
    Config.find({}).lean().exec(function (err, configs) {
        if (err) {
            //TODO: send proper HTTP code
            log.error('config find error: %e', err);
            return res.status(500).send({
                error: true
            });
        }
        res.send(parse(configs));
    });
});

router.get('/configs/:name', function (req, res) {
    Config.findOne({
        name: req.params.name
    }).lean().exec(function (err, config) {
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
        res.send(parse(config));
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
    Config.create(stringify(req.body), function (err, config) {
        if (err) {
            log.error('config find error: %e', err);
            return res.status(500).send({
                error: true
            });
        }
        res.send(config);
    });
});