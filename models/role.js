var mongoose = require('mongoose');
var permission = require('../lib/permission');
var databases = require('../lib/databases');
var hub = databases.hub;

var Schema = mongoose.Schema;

var role = Schema({
    name: String,
    description: String,
    has: {type: Object, default: {}},
    allowed: {type: Object, default: {}}
});

role.methods.can = function (perm, action) {
    return permission.has(this.has, perm.split(':'), action);
};

role.methods.permit = function (perm, actions, done) {
    actions = actions instanceof Array ? actions : [actions];
    permission.add(this.has, perm.split(':'), actions);
    this.save(done);
};

role.virtual('id').get(function () {
    return this._id;
});

module.exports = hub.model('Role', role);