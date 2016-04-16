var log = require('logger')('hub:lib:domain');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var databases = require('../lib/databases');
var hub = databases.hub;

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

module.exports = hub.model('Domain', domain);