var log = require('logger')('hub:apis:apps');
var express = require('express');
var router = express.Router();

var App = require('../models/app');
var Deployment = require('../models/deployment');
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
        if (err) {
            log.error('error retrieving app: %s', req.params.id);
            return res.sendStatus(500);
        }
        if (!app) {
            return res.sendStatus(404);
        }
        Deployment.create({
            apps: [app.id]
        }, function (err, deployment) {
            if (err) {
                log.error('error creating deployment for app: %s', app.id);
                return res.sendStatus(500);
            }
            deployer.deploy(deployment.id, function (err) {
                if (err) {
                    log.error(err);
                }
            });
            res.sendStatus(202);
        });
    })
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