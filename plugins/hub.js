var PLUGIN = 'hub';

module.exports = function (notify, options) {
    console.log(options);
    var action = options.action;
    switch (action) {
        case 'update':
            //TODO here
            notify({
                action: action
            });
            break;
        case 'updated':
            console.log('updated');
            break;
    }
};