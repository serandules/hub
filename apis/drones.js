var express = require('express');
var router = express.Router();

router.get('/drones', function (req, res) {
    res.send([{server: 's1'}]);
});

router.get('/drones/:id', function (req, res) {
    res.send({server: 's1'});
});

module.exports = router;