exports.loc = function (req, res, next) {
    req.loc = function () {
        var args = Array.prototype.slice.call(arguments);
        res.set('Location', '/' + args.join('/'));
        return res;
    };
    next();
};