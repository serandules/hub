var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var mongoose = require('mongoose');
var permission = require('permission');

var Schema = mongoose.Schema;

var user = Schema({
    email: {type: String, index: {unique: true}},
    password: String,
    tokens: [{type: Schema.Types.ObjectId, ref: 'Token'}],
    has: {type: Object, default: {}},
    allowed: {type: Object, default: {}},
    roles: [{type: Schema.Types.ObjectId, ref: 'Role'}],
    alias: String,
    firstname: String,
    lastname: String,
    birthday: Date,
    addresses: {},
    mobiles: [String],
    socials: {}
});

user.set('toJSON', {
    getters: true,
    //virtuals: false,
    transform: function (doc, ret, options) {
        delete ret.password;
        delete ret._id;
    }
});

user.methods.auth = function (password, callback) {
    bcrypt.compare(password, this.password, function (err, res) {
        callback(err, res);
    });
};

user.methods.can = function (perm, action) {
    return permission.has(this.has, perm.split(':'), action);
};

user.methods.permit = function (perm, actions, done) {
    actions = actions instanceof Array ? actions : [actions];
    permission.add(this.has, perm.split(':'), actions);
    this.save(done);
};

var encrypt = function (password, done) {
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) {
            return done(err);
        }
        bcrypt.hash(password, salt, function (err, hash) {
            if (err) {
                return done(err);
            }
            done(false, hash);
        });
    });
};

user.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }
    encrypt(user.password, function (err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});

user.pre('update', function (next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }
    encrypt(user.password, function (err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});

user.virtual('id').get(function () {
    return this._id;
});
/*
 user.statics.find = function (options, callback) {
 if (options.email) {
 this.findOne({
 email: email
 }, callback);
 return;
 }
 callback(null);
 };*/

module.exports = mongoose.model('User', user);