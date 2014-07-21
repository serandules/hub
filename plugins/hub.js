var sockt = require('../lib/socket');

var PLUGIN = 'hub';

module.exports = function (socket, options) {
    console.log(options);
    var server,
        action = options.action;
    switch (action) {
        case 'update':
            console.log(options.id);
            server = sockt.servers(options.id);
            server.socket.emit('exec', {
                plugin: PLUGIN,
                action: action
            });
            break;
    }
};