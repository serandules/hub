var sockt = require('../lib/socket');

var PLUGIN = 'hub';

module.exports.serve = function (socket, options) {
    console.log(options);
    var server,
        action = options.action;
    switch (action) {
        case 'run':
            server = sockt.server(options.id);
            server.socket.emit('exec', {
                plugin: PLUGIN,
                action: action
            });
            break;
    }
};