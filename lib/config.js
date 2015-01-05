var debug = require('debug')('serandules:hub');
var mongoose = require('mongoose');
var hub = require('./hub');
var Schema = mongoose.Schema;
var express = require('express');
var app = module.exports.app = express();


var config = Schema({
    name: String,
    value: String
});

config.set('toJSON', {
    getters: true,
    //virtuals: false,
    transform: function (doc, ret, options) {
        delete ret._id;
    }
});

config.virtual('id').get(function () {
    return this._id;
});

var Config = (module.exports.model = mongoose.model('Config', config));

app.get('/configs', function (req, res) {
    Config.find({}).exec(function (err, configs) {
        if (err) {
            //TODO: send proper HTTP code
            console.error('config find error');
            res.send({
                error: true
            });
            return;
        }
        res.send(configs);
    });
});

app.get('/configs/:id', function (req, res) {
    Config.findOne({
        _id: req.params.id
    }).exec(function (err, config) {
        if (err) {
            //TODO: send proper HTTP code
            console.error('config find error');
            res.send({
                error: true
            });
            return;
        }
        res.send(config);
    });
});

app.delete('/configs/:id', function (req, res) {
    Config.findOne({
        _id: req.params.id
    }).exec(function (err, config) {
        if (err) {
            //TODO: send proper HTTP code
            console.error('config find error');
            res.send({
                error: true
            });
            return;
        }
        config.remove();
        res.send({
            error: false
        });
    });
});

app.post('/configs', function (req, res) {
    Config.create(req.body, function (err, config) {
        if (err) {
            console.error(err);
            res.send({
                error: true
            });
            return;
        }
        res.send(config);
    });
});