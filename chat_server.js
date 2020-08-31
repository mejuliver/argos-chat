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

let dbready = false;
let con = false;
let socketList = io.sockets.server.eio.clients;

const r = require('rethinkdb');

let argos = {
	create : function(){
		this.prepareDB();
	},
	prepareDB : function(){
		let _this = this;

		r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
		  if(err){
		  	throw err; // throw error
		  }else{
		  	con = conn;
  			r.dbCreate('argosdb').run(conn).then(function(){
  				_this.initTables();
  			}).catch(function(){
  				_this.initTables();
  			});
		  		
		  	// create login table if not found
		  }
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
		r.db('argosdb').table('messages').indexCreate('usersid').run(con).catch(function(){});
		r.db('argosdb').table('admin').indexCreate('type').run(con).catch(function(){});
	},
	findAgent : function(){
		r.db('argosdb').table('admin').filter({
			type : 'agent',
			online : true,
			room : 	false,
			session : false
		}).run(con).then(function(res){
			// console.log('agent found');
			
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
						        			_this.findAgent();
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