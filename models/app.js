var log = require('logger')('hub:lib:app');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var databases = require('../lib/databases');
var hub = databases.hub;

var app = Schema({
    name: String,
    repo: String
});

app.set('toJSON', {
    getters: true,
    //virtuals: false,
    transform: function (doc, ret, options) {
        delete ret._id;
    }
});

app.virtual('id').get(function () {
    return this._id;
});

module.exports = hub.model('App', app);