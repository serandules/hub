var log = require('logger')('hub:apis:apps');
var express = require('express');
var router = express.Router();

var App = require('../models/app');
var hub = require('../lib/hub');
var deployer = require('../lib/deployer');

module.exports = router;

router.get('/apps', function (req, res) {
    App.find({}).exec(function (err, apps) {
        res.send(apps);
    });
});

router.get('/apps/:id', function (req, res) {
    App.findOne({
        _id: req.params.id
    }).exec(function (err, app) {
        res.send(app);
    });
});

router.post('/apps/:id/deploy', function (req, res) {
    App.findOne({
        _id: req.params.id
    }).exec(function (err, app) {
        if (!app) {
            return res.status(404);
        }
        deployer.deploy(app.repo, function (err) {
            if (err) {
                log.error(err);
            }
        });
        res.send({
            error: false
        });
    });
});

router.post('/apps', function (req, res) {
    App.create(req.body, function (err, app) {
        res.send(app);
    });
});

router.delete('/apps/:id', function (req, res) {
    App.findOne({
        _id: req.params.id
    }).exec(function (err, app) {
        app.remove();
        res.send({
            error: false
        });
    });
});