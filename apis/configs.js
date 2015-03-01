var express = require('express');
var router = express.Router();

module.exports = router;

router.get('/configs', function (req, res) {
    res.send([{server: 's1'}]);
});

router.get('/configs/:id', function (req, res) {
    res.send({server: 's1'});
});