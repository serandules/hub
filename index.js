var fs = require('fs');
var build = require('build');
var express = require('express');
var mongoose = require('mongoose');
var token = require('hub-token');
var auth = require('auth');

var mongourl = 'mongodb://localhost/test';
var HTTP_PORT = 4000;
var app = express();

auth = auth(token, {
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

    //menu apis
    app.use('/apis/v', require('./lib/menus'));

    //hot component building
    app.use(build);

    //index page
    app.all('*', function (req, res) {
        //TODO: check caching headers
        res.set('Content-Type', 'text/html').send(200, index);
    });

    app.use(express.json());
    app.use(express.urlencoded());

    app.listen(HTTP_PORT);
    console.log('listening on port ' + HTTP_PORT);
});