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
var express = require("express");
var app = express();
var port = 3700;
var https = require('https');
var fs =    require('fs');

var io = require('socket.io').listen(app.listen(port));

var uniqid = require('uniqid');

// cons html entities
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();    

let socketList = io.sockets.server.eio.clients;

// clear the connections, session_ids, chat que table
io.sockets.on('connection', function (socket) {

    socket.on('message',function(msg){
        
        switch(msg.command){    

            case 'connect' : // when client or agent wants to connect to the chat server

            
            break;
        }

    });

});

io.sockets.on('connection', function (socket) {
    socket.on('disconnect', function () {
        console.log('disconnecting '+socket.id);

    });
});

console.log("Listening on port " + port);