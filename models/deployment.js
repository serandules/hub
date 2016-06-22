var log = require('logger')('deployment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var databases = require('../lib/databases');
var hub = databases.hub;

var deployment = Schema({
    name: String,
    description: String,
    apps: [{type: Schema.Types.ObjectId, ref: 'App'}],
    domains: [{type: Schema.Types.ObjectId, ref: 'Domain'}],
    has: {type: Object, default: {}},
    allowed: {type: Object, default: {}}
});

deployment.set('toJSON', {
    getters: true,
    //virtuals: false,
    transform: function (doc, ret, options) {
        delete ret._id;
    }
});

deployment.virtual('id').get(function () {
    return this._id;
});

module.exports = hub.model('Deployment', deployment);