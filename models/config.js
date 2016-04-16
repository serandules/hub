var log = require('logger')('config');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var databases = require('../lib/databases');
var hub = databases.hub;

var config = Schema({
    name: String,
    value: String,
    has: {type: Object, default: {}},
    allowed: {type: Object, default: {}}
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

module.exports = hub.model('Config', config);