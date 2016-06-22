var log = require('logger')('hub:lib:release');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var databases = require('../lib/databases');
var hub = databases.hub;

var release = Schema({
    repo: String,
    revision: String
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