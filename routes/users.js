var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('ay');
});

router.get('/fuck', function(req, res, next) {
  res.send('fuck 12');
});

module.exports = router;
