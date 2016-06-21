var express = require('express');
var router = express.Router();

module.exports = router;

router.get('/menus/:id', function (req, res) {
    res.send({
        home: {url: '/', title: 'serandives.com'},
        menu: [
            {url: '/hub', title: 'Hub'},
            {url: '/apps', title: 'Apps'},
            {url: '/domains', title: 'Domains'},
            {url: '/configs', title: 'Configs'},
            {url: '/serand/configs', title: 'Serand'}
        ]
    });
});