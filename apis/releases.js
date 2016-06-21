var log = require('logger')('apis:releases');
var express = require('express');
var router = express.Router();

var Release = require('../models/release');
var build = require('../lib/build');

module.exports = router;

router.get('/releases/:id', function (req, res) {
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

router.post('/releases', function (req, res) {
    Release.create(req.body, function (err, release) {
        if (err) {
            res.status(400).send({
                error: 'error while creating release'
            });
            return;
        }
        res.loc('releases', release.id).status(201).end();
    });
});

router.post('/releases/:id/build', function (req, res) {
    var id = req.params.id;
    build(id, function (err) {
        var status = err ? 'failed' : 'done';
        Release.update({_id: id}, {
            'status.build': status
        }, function (err) {
            if (err) {
                log.error('error building release: %s, err: %s', id, err);
            }
        });
    });
    res.status(202).end()
});