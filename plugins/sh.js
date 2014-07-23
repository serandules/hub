var PLUGIN = 'sh';

module.exports = function (notify, options) {
    console.log(options);
    var action = options.action;
    switch (action) {
        case 'run':
            //TODO here
            notify({
                action: action,
                command: options.command,
                args: options.args
            });
            break;
        case 'stdout':
            console.log('-----------------------------sh---------------------------');
            console.log(options.data);
            break;
        case 'stderr':
            break;
    }
};