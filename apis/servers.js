var express = require('express');
var router = express.Router();

router.get('/servers', function (req, res) {
    res.send([{server: 's1'}]);
});

router.get('/servers/:id', function (req, res) {
    res.send({server: 's1'});
});

module.exports = router;