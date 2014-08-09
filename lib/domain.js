var mongoose = require('mongoose');
var hub = require('./hub');
var Schema = mongoose.Schema;
var express = require('express');
var app = module.exports.app = express();


var domain = Schema({
    name: String,
    repo: String
});

domain.set('toJSON', {
    getters: true,
    //virtuals: false,
    transform: function (doc, ret, options) {
        delete ret._id;
    }
});

domain.virtual('id').get(function () {
    return this._id;
});

var Domain = (module.exports.model = mongoose.model('Domain', domain));

app.get('/domains', function (req, res) {
    Domain.find({}).exec(function (err, domains) {
        if (err) {
            //TODO: send proper HTTP code
            console.error('domain find error');
            res.send({
                error: true
            });
            return;
        }
        res.send(domains);
    });
});

app.get('/domains/:id', function (req, res) {
    Domain.findOne({
        _id: req.params.id
    }).exec(function (err, domain) {
        if (err) {
            //TODO: send proper HTTP code
            console.error('domain find error');
            res.send({
                error: true
            });
            return;
        }
        res.send(domain);
    });
});

app.get('/domains/:id/drones', function (req, res) {
    var domain = hub.domains(req.params.id);
    res.send(domain ? domain.drones : []);
});

app.delete('/domains/:id', function (req, res) {
    Domain.findOne({
        _id: req.params.id
    }).exec(function (err, domain) {
        if (err) {
            //TODO: send proper HTTP code
            console.error('domain find error');
            res.send({
                error: true
            });
            return;
        }
        domain.remove();
        res.send({
            error: false
        });
    });
});

app.post('/domains', function (req, res) {
    Domain.create(req.body, function (err, domain) {
        if (err) {
            console.error(err);
            res.send({
                error: true
            });
            return;
        }
        res.send(domain);
    });
});