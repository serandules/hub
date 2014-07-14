var fs = require('fs');
var build = require('build');
var express = require('express');
var mongoose = require('mongoose');
var auth = require('auth');

var mongourl = 'mongodb://localhost/hub';
var HTTP_PORT = 4000;
var app = express();

auth = auth({
    open: [
        '^(?!\\/apis(\\/|$)).+',
        '^\/apis\/v\/tokens([\/].*|$)',
        '^\/apis\/v\/vehicles$',
        '^\/apis\/v\/menus\/.*$'
    ]
});

var index = fs.readFileSync('./public/index.html', 'utf-8');

mongoose.connect(mongourl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log('connected to mongodb : ' + mongourl);

    app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
    app.use('/public', express.static(__dirname + '/public'));

    //auth header loading
    app.use(auth);

    app.use(express.json());
    app.use(express.urlencoded());

    //token apis
    app.use('/apis/v', require('token-service'));
    app.use('/apis/v', require('user-service'));
    //menu apis
    app.use('/apis/v', require('./lib/menu'));

    //hot component building
    app.use(build);

    //index page
    app.all('*', function (req, res) {
        //TODO: check caching headers
        res.set('Content-Type', 'text/html').send(200, index);
    });

    app.listen(HTTP_PORT);
    console.log('listening on port ' + HTTP_PORT);
});