// -- PRODUCTION
// const port = 3700;
// const https = require('https');
// const fs =    require('fs');
// const options = {
//     key:    fs.readFileSync('ssl/cn.key'),
//     cert:   fs.readFileSync('ssl/cn.crt'),
//     ca:     'GlobalSign Domain Validation CA'
// };
// const app = https.createServer(options);
// const io = require('socket.io').listen(app);  //socket.io server listens to https connections
// app.listen(port, "0.0.0.0");

// - DEVELOPMENT
const express = require("express");
const app = express();
const port = 3700;
const https = require('https');
const fs = require('fs');
const moment = require('moment');

let io = require('socket.io').listen(app.listen(port));

let uniqid = require('uniqid');

// cons html entities
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();    

let con = false;
let socketList = io.sockets.server.eio.clients;

const r = require('rethinkdb');

// ## EXPRESS JS ADMIN
const path = require('path');
const bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public'));

// -- router
const router = require(path.join(__dirname,'router.js'));

app.use('/', router);

// generate a custom password
// const passwordHash = require('password-hash');

// console.log( passwordHash.generate('test') );

// -- END

const rethinkdb_con = require(path.join(__dirname, 'helpers/rethinkdb-connect.js'));

const argos = {
	create : function(){
		this.prepareDB();
	},
	prepareDB : function(){
		let _this = this;

		rethinkdb_con.connect(function(err,conn){
			con = conn;
  			r.dbCreate('argosdb').run(conn).then(function(){
  				_this.initTables();
  			}).catch(function(){
  				_this.initTables();
  			});
		});
	},
	initTables : function(){
		let _this = this;
		// create connections
		r.db('argosdb').tableCreate('connections').run(con).then(function(){
			console.log('argos connections table has been created');
		}).catch(function(){
			r.db('argosdb').table('connections').delete().run(con);
			console.log('argos connections already created');
		});

		r.db('argosdb').tableCreate('users').run(con).then(function(){
			console.log('argos users table has been created');
		}).catch(function(){
			console.log('argos users table already created');
		});

		r.db('argosdb').tableCreate('auth').run(con).then(function(){
			console.log('argos auth table has been created');
		}).catch(function(){
			console.log('argos auth table already created');
		});

		r.db('argosdb').tableCreate('messages').run(con).then(function(){
			console.log('argos messages table has been created');
		}).catch(function(){
			console.log('argos messages table already created');
		});
		r.db('argosdb').tableCreate('admin').run(con).then(function(){
			console.log('argos messages table has been created');
		}).catch(function(){
			console.log('argos messages table already created');
		});
		r.db('argosdb').tableCreate('sessions').run(con).then(function(){
			console.log('argos sessions table has been created');
		}).catch(function(){
			console.log('argos sessions table already created');
		});


		let timer = setInterval(function(){
			r.db('argosdb').tableList().run(con).then(function(res){
				if( res.includes('connections') && res.includes('users') && res.includes('messages') && res.includes('admin') ){
					_this.startServer();
					clearInterval(timer);
				}
			});

		},1000)
	},
	prepareDBIndex : function(){
		r.db('argosdb').table('connections').indexCreate('userid').run(con).catch(function(){});
		r.db('argosdb').table('users').indexCreate('first_name').run(con).catch(function(){});
		r.db('argosdb').table('users').indexCreate('email').run(con).catch(function(){});
		r.db('argosdb').table('messages').indexCreate('userid').run(con).catch(function(){});
		r.db('argosdb').table('admin').indexCreate('type').run(con).catch(function(){});
		r.db('argosdb').table('admin').indexCreate('email').run(con).catch(function(){});
		r.db('argosdb').table('sessions').indexCreate('sess_key').run(con).catch(function(){});
		r.db('argosdb').table('sessions').indexCreate('name').run(con).catch(function(){});
	},
	findAgent : function(socketid){
		r.db('argosdb').table('admin').filter({
			type : 'agent',
			online : true,
			session : false
		}).run(con).then(function(res){
			console.log('agent found');
			res.toArray(function(err,result){
				if( result.length > 0 ){
					r.db('argosdb').table('admin').get(result.id).update({
						session : socketid
					}).run(con).then(function(){
						io.sockets.connected[socketid].emit("argos", { type : 'find agent', success : true, data : result[0] } );
					}).catch(function(){
						console.log('Unable to update agent session to per with socket id '+socketid);
						io.sockets.connected[socketid].emit("argos", { type : 'find agent', success : false } );
					})
				}

			});
		});
	},
	startServer : function(){
		let _this = this;
		this.prepareDBIndex();

		console.log('Argos server has been initialized');

		// clear the connections, session_ids, chat que table
		io.sockets.on('connection', function (socket) {

			r.db('argosdb').table('connections').insert({ // add socket to db connections
        		socketid : socket.id,
        		usersid : false
        	}).run(con);

			// return 'ok' to client
			io.sockets.connected[socket.id].emit("argos", { type : 'connect', success : true } );


		    socket.on('argos',function(msg){
		        
		        switch(msg.type){    

		            case 'register' : // register user
		            	// update if found
		            	r.db('argosdb').table('users').filter(r.row('email').eq(msg.msg.email)).run(con).then(function(res){
		            		res.toArray(function(err,result){
		            			if( result.length > 0 ){
		            				r.db('argosdb').table('users').get(result[0].id).update({ // insert to users
						        		first_name : msg.msg.fname,
						        		last_name : msg.msg.lname,
						        		email : msg.msg.email,
						        		updated_at : moment().format('Y-MM-DD h:m:s')
						        	}).run(con).then(function(res){
						        		r.db('argosdb').table('connections').filter(r.row('socketid').eq(socket.id)).update({
						        			usersid : result[0].id
						        		}).run(con).then(function(){
						        			io.sockets.connected[socket.id].emit("argos", { type : 'register', success : true } );
						        			// find agent
						        			_this.findAgent();
						        		}).catch(function(){
						        			console.log('User for '+socket.id+' not found');
						        		});
						        	});
		            			}else{
		            				r.db('argosdb').table('users').insert({ // insert to users
						        		first_name : msg.msg.fname,
						        		last_name : msg.msg.lname,
						        		email : msg.msg.email,
						        		created_at : moment().format('Y-MM-DD h:m:s'),
						        		updated_at : false
						        	},{
						        		returnChanges : true,
						        	}).run(con).then(function(res){
						        		r.db('argosdb').table('connections').filter(r.row('socketid').eq(socket.id)).update({
						        			usersid : res.generated_keys[0]
						        		}).run(con).then(function(){
						        			io.sockets.connected[socket.id].emit("argos", { type : 'register', success : true } );
						        			// find agent
						        			_this.findAgent(socket.id);
						        		}).catch(function(){
						        			console.log('User for '+socket.id+' not found');
						        		});
						        	});
		            			}
		            		});
		            		
		            	})
		            break;
		        }

		    });

		});

		io.sockets.on('connection', function (socket) {
		    socket.on('disconnect', function () {
		        console.log('disconnecting '+socket.id);
		        r.db('argosdb').table('connections').filter( r.row('socketid').eq(socket.id) ).delete().run(con).then(function(){
		        	console.log(socket.id+' has been deleted from connections table');
		        }).catch(function(){
		        	console.log(socket.id+' not found from connections table');
		        });
		    });
		});
	}
}

argos.create();

console.log("Listening on port " + port);