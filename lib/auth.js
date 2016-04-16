var log = require('logger')('auth');
var mongoose = require('mongoose');
var Token = require('../models/token');

require('../models/client');
require('../models/user');

module.exports = function (options) {
    return function (req, res, next) {
        var path = req.path;
        var open = options.open;
        var i, length;
        if (open) {
            length = open.length;
            for (i = 0; i < length; i++) {
                if (new RegExp(open[i], 'i').test(path)) {
                    return next();
                }
            }
        }
        var hybrid;
        var auth = req.headers['authorization'];
        if (!auth) {
            hybrid = options.hybrid;
            if (hybrid) {
                length = hybrid.length;
                for (i = 0; i < length; i++) {
                    if (new RegExp(hybrid[i], 'i').test(path)) {
                        return next();
                    }
                }
            }
            res.status(401).send({
                error: 'missing authorization header'
            });
            return;
        }
        var match = /^\s*Bearer\s+(.*)$/g.exec(auth);
        if (!match) {
            res.status(401).send({
                error: 'invalid authorization header'
            });
            return;
        }
        var token = match[1];
        //TODO: validate auth header
        Token.findOne({
            access: token
        }).populate('client')
            .exec(function (err, token) {
                if (err) {
                    res.status(500).send({
                        error: err
                    });
                    return;
                }
                if (!token) {
                    res.status(401).send({
                        error: 'unauthorized token'
                    });
                    return;
                }
                log.debug('client token expires in : %s', token.accessibility());
                if (token.accessibility() === 0) {
                    res.status(401).send({
                        error: 'token expired'
                    });
                    return;
                }
                req.token = token;
                next();
            });
    };
};