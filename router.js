const express = require('express');
const router = express.Router();
const path = require('path');
const cookieSession = require('cookie-session');
// -- controllers
const account = require(path.join(__dirname, 'controllers/account.js'));

app.use(cookieSession({
  name: 'session',
  keys: ['argoschat2020'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now());
  next();
})
// -- default
router.get('/', function(req, res) {
    res.render('login', { title: 'Login | Argos Chat' });
});

// -- login page
router.get('/login', function(req, res) {
    res.render('login', { title: 'Login | Argos Chat' });
});

// -- POST login
router.post('/do-login', (req, res) => {
    account.login(req.body.email,req.body.password,(result)=>{
        res.setHeader('Content-Type', 'application/json');
        res.send(result);
    });
});



module.exports = router;