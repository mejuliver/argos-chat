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
let express = require("express");
let app = express();
let port = 3700;
let https = require('https');
let fs =    require('fs');

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
		  	let dblist = [];
		  	r.dbList().run(conn).then(function(res){
		  		if( !res.includes('argosdb') ){
		  			r.dbCreate('argosdb').run(conn).then(function(){
		  				r.db('argosdb').tableCreate('connections').run(conn).catch(function(){
		  					_this.startServer();
		  					console.log('argos connections table has been created');
		  				}).then(function(){
		  					_this.startServer();
		  				});
		  			});
		  		}else{
	  				r.db('argosdb').tableCreate('connections').run(conn).catch(function(){
	  					_this.startServer();
	  					console.log('argos connections table has been created');
	  				}).then(function(){
	  					_this.startServer();
	  				});
		  		}
		  	});
		  }  
		});
	},
	prepareConnectionsIndex : function(){
		r.db('argosdb').table('connections').indexCreate('socketid').run(con).catch(function(){});
		r.db('argosdb').table('connections').indexCreate('userid').run(con).catch(function(){});
	},
	startServer : function(){
		this.prepareConnectionsIndex();
		// clear the connections, session_ids, chat que table
		io.sockets.on('connection', function (socket) {

		    socket.on('message',function(msg){
		        
		        switch(msg.command){    

		            case 'connect' : // when client or agent wants to connect to the chat server
		            r.db('argosdb').table('connections').
		            
		            break;
		        }

		    });

		});

		io.sockets.on('connection', function (socket) {
		    socket.on('disconnect', function () {
		        console.log('disconnecting '+socket.id);

		    });
		});
	}
}

argos.create();

console.log("Listening on port " + port);