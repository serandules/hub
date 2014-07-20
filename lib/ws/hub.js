var uuid = require('node-uuid');

var clients = [];

module.exports.serve = function (socket, options, next) {
    console.log('--hub--');
    console.log(options);
    if (options.type !== 'hub') {
        return next();
    }
    var headers = socket.upgradeReq.headers;
    if (headers['user-agent'] !== 'hub-client') {
        return next();
    }
    var event = options.event;
    switch (event) {
        case 'subscribe':
            clients.push({
                id: uuid.v4(),
                socket: socket
            });
            break;
        case 'unsubscribe':
            break;
    }
};

module.exports.clients = function () {
    return clients;
};