var express = require('express');
var router = express.Router();

router.get('/domains', function (req, res) {
    res.send([{server: 's1'}]);
});

router.get('/domains/:id', function (req, res) {
    res.send({server: 's1'});
});

module.exports = router;