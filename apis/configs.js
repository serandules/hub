var express = require('express');
var router = express.Router();
var Config = require('../lib/config');

module.exports = router;

router.get('/configs', function (req, res) {
    Config.find({}).exec(function (err, configs) {
        if (err) {
            //TODO: send proper HTTP code
            console.error('config find error');
            return res.status(500).send({
                error: true
            });
        }
        res.send(configs);
    });
});

router.get('/configs/:id', function (req, res) {
    Config.findOne({
        _id: req.params.id
    }).exec(function (err, config) {
        if (err) {
            //TODO: send proper HTTP code
            console.error('config find error');
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

router.delete('/configs/:id', function (req, res) {
    Config.findOne({
        _id: req.params.id
    }).exec(function (err, config) {
        if (err) {
            //TODO: send proper HTTP code
            console.error('config find error');
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
            console.error(err);
            return res.status(500).send({
                error: true
            });
        }
        res.send(config);
    });
});