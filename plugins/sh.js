var uuid = require('node-uuid');
var sockt = require('../lib/socket');

var PLUGIN = 'sh';

var ctxs = {};

module.exports = function (options, notify) {
    console.log(options);
    var server, id, ctx,
        action = options.action;
    switch (action) {
        case 'run':
            //TODO here
            id = uuid.v4();
            server = sockt.servers(options.id);
            ctxs[id] = {
                id: options.id,
                server: server,
                notify: notify
            };
            options.id = id;
            server.socket.emit('do', options);
            break;
        case 'stdout':
            console.log('-----------------------------sh---------------------------');
            console.log(options.data);
            break;
        case 'stderr':
            break;
        case 'ran':
            ctx = ctxs[options.id];
            delete ctxs[options.id];
            options.id = ctx.id;
            ctx.notify(options);
            break;
    }
};