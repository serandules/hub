var log = require('logger')('config');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var databases = require('../../lib/databases');
var serand = databases.serand;

var config = Schema({
    name: String,
    value: Object,
    has: {type: Object, default: {}},
    allowed: {type: Object, default: {}}
});

config.pre('save', function (next) {
    var config = this;
    if (!config.isModified('value')) {
        return next();
    }
    config.value = JSON.stringify(config.value);
    next();
});

config.pre('update', function (next) {
    var config = this;
    if (!config.isModified('value')) {
        return next();
    }
    config.value = JSON.stringify(config.value);
    next();
});

config.post('find', function (configs) {
    configs.forEach(function (config) {
        config.value = config.value ? JSON.parse(config.value) : null;
    });
});

config.post('findOne', function (config) {
    if (!config) {
        return;
    }
    config.value = config.value ? JSON.parse(config.value) : null;
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

module.exports = serand.model('Config', config);