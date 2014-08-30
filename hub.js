var childProcess = require('child_process');
var spawn = childProcess.spawn;
var fork = childProcess.fork;

var server;

var start = function () {
    var child = spawn('bash');
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.stdin.write('git pull\n');
    child.kill('SIGINT');
    console.log('server starting');
    if (server) {
        server.kill('SIGINT');
        console.log('server killed');
    }
    server = fork('index.js', {
        silent: true
    });
    server.stdout.pipe(process.stdout);
    server.stderr.pipe(process.stderr);
    server.on('message', function (data) {
        switch (data.event) {
            case 'self up':
                start();
                break;
        }
    });
};

start();