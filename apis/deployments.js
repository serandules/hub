var log = require('logger')('apis:deployments');
var express = require('express');
var router = express.Router();

var Deployment = require('../models/deployment');
var build = require('../lib/build');

module.exports = router;

router.get('/deployments/:id', function (req, res) {
    res.send({
        home: {url: '/', title: 'serandives.com'},
        menu: [
            {url: '/hub', title: 'Hub'},
            {url: '/domains', title: 'Domains'},
            {url: '/configs', title: 'Configs'},
            {url: '/serand/configs', title: 'Serand'}
        ]
    });
});

router.post('/deployments', function (req, res) {
    Deployment.create(req.body, function (err, deployment) {
        if (err) {
            res.status(400).send({
                error: 'error while creating deployment'
            });
            return;
        }
        res.loc('deployments', deployment.id).status(201).end();
    });
});

router.post('/deployments/:id/build', function (req, res) {
    var id = req.params.id;
    build(id, function (err) {
        var status = err ? 'failed' : 'done';
        Deployment.update({_id: id}, {
            'status.build': status
        }, function (err) {
            if (err) {
                log.error('error building deployment: %s, err: %s', id, err);
            }
        });
    });
    res.status(202).end()
});