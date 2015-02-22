var log = require('logger')('hub:lib:domain');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

module.exports = mongoose.model('Domain', domain);