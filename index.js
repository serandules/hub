var fs = require('fs');
//var process = require('process');
var build = require('build');
var express = require('express');
var proxy = require('http-proxy');

var server = new proxy.RoutingProxy();

var allowed = {
    'accounts.serandives.com': 4000,
    'auto.serandives.com': 4000,
    'localhost': 4000
};

var app = module.exports = express();

var index = fs.readFileSync('./public/index.html', 'utf-8');

app.use(express.favicon(__dirname + '/public/images/favicon.ico'));

app.use('/public', express.static(__dirname + '/public'));

app.use(function (req, res, next) {
    var xhost = req.header('x-host');
    if (xhost) {
        xhost = xhost.split(':');
        var host = xhost[0];
        var port = xhost.length === 2 ? xhost[1] : 80;
        if (allowed[host] != port) {
            res.send(404, 'Not Found');
            return;
        }
        console.log('proxing request to host: ' + host + ' port: ' + port);
        server.proxyRequest(req, res, {
            host: host,
            port: port
        });
        return;
    }
    next();
});

var env = process.env.NODE_ENV;
if (env !== 'production') {
    app.use(build);
}

/**
 * GET index page.
 */
app.all('*', function (req, res) {
    //TODO: check caching headers
    res.set('Content-Type', 'text/html').send(200, index);
});

app.listen(2000);
console.log('listening on port 2000');