const express = require('express');
const app = express();
const router = express.Router();
const path = require('path');
const cookie = require('cookie-parser');
const session = require('express-session');
const RDBStore = require('express-session-rethinkdb')(session);
// -- controllers
const account = require(path.join(__dirname, 'controllers/account.js'));

const rdbStore = new RDBStore({
  connectOptions: {
    servers: [
      { host: 'localhost', port: 28015 },
    ],
    db: 'argosdb',
    discovery: false,
    pool: true,
    buffer: 50,
    max: 1000,
    timeout: 20,
    timeoutError: 1000
  },
  table: 'sessions',
  sessionTimeout: 86400000,
  flushInterval: 60000,
  debug: false
});
 
app.use(cookie());
app.use(session({
  key: 'sid',
  secret: 'argoschat2020',
  cookie: { maxAge: 860000 },
  store: rdbStore
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