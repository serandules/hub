var log = require('logger')('release');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var databases = require('../lib/databases');
var hub = databases.hub;

var release = Schema({
    name: String,
    description: String,
    sources: [],
    has: {type: Object, default: {}},
    allowed: {type: Object, default: {}}
});

release.set('toJSON', {
    getters: true,
    //virtuals: false,
    transform: function (doc, ret, options) {
        delete ret._id;
    }
});

release.virtual('id').get(function () {
    return this._id;
});

module.exports = hub.model('Release', release);