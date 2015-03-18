var express = require('express');
var router = express.Router();

module.exports = router;

router.get('/menus/:id', function (req, res) {
    res.send({
        home: {url: '/', title: 'serandives.com'},
        menu: [
            {url: '/hub', title: 'Hub'},
            {url: '/domains', title: 'Domains'},
            {url: '/configs', title: 'Configs'}
        ]
    });
});