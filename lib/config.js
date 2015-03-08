var debug = require('debug')('serandules:hub');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

module.exports = mongoose.model('Config', config);