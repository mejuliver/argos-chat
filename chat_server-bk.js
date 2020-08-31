// -- PRODUCTION
const port = 3700;
const https = require('https');
const fs =    require('fs');
const options = {
    key:    fs.readFileSync('ssl/cn.key'),
    cert:   fs.readFileSync('ssl/cn.crt'),
    ca:     'GlobalSign Domain Validation CA'
};
const app = https.createServer(options);
const io = require('socket.io').listen(app);  //socket.io server listens to https connections
app.listen(port, "0.0.0.0");

// - DEVELOPMENT
// var express = require("express");
// var app = express();
// var port = 3700;
// var https = require('https');
// var fs =    require('fs');

// var io = require('socket.io').listen(app.listen(port));

var uniqid = require('uniqid');

// cons html entities
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();    

// rethinkdb
var connection = null;
var r = require('rethinkdb');

r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
    if(err) throw err;
    connection = conn; // store the rethinkdb connection
    var socketList = io.sockets.server.eio.clients;

    // clear the connections, session_ids, chat que table
    if( r.dbList().contains('cn_chat') ){
        if( r.db('cn_chat').tableList().contains('session_ids') ){
            r.db('cn_chat').table('session_ids').delete().run(connection);
        }else{
            r.db('cn_chat').tableCreate('session_ids').run(connection);
        }
        if( r.db('cn_chat').tableList().contains('connections') ){
            r.db('cn_chat').table('connections').delete().run(connection);
        }else{
            r.db('cn_chat').tableCreate('connections').run(connection);
        }
        if( r.db('cn_chat').tableList().contains('chat_que') ){
            r.db('cn_chat').table('chat_que').delete().run(connection);
        }else{
            r.db('cn_chat').tableCreate('chat_que').run(connection);
        }
        if( !r.db('cn_chat').tableList().contains('messages') ){
            r.db('cn_chat').tableCreate('messages').run(connection);
        }
        if( !r.db('cn_chat').tableList().contains('users_settings') ){
            r.db('cn_chat').tableCreate('users_settings').run(connection);
        }
        if( !r.db('cn_chat').tableList().contains('agents') ){
            r.db('cn_chat').tableCreate('agents').run(connection);
        }
        if( !r.db('cn_chat').tableList().contains('agents_ratings') ){
            r.db('cn_chat').tableCreate('agents_ratings').run(connection);
        }
        if( !r.db('cn_chat').tableList().contains('session_history') ){
            r.db('cn_chat').tableCreate('session_history').run(connection);
        }
        if( !r.db('cn_chat').tableList().contains('agent_ratings') ){
            r.db('cn_chat').tableCreate('agent_ratings').run(connection);
        }
    }else{
        r.dbCreate('cn_chat').run(connection,function(err,result){
            r.db('cn_chat').tableCreate('session_ids').run(connection);
            r.db('cn_chat').tableCreate('connections').run(connection);
            r.db('cn_chat').tableCreate('chat_que').run(connection);
            r.db('cn_chat').tableCreate('messages').run(connection);
            r.db('cn_chat').tableCreate('users_settings').run(connection);
            r.db('cn_chat').tableCreate('agents').run(connection);
            r.db('cn_chat').tableCreate('session_history').run(connection);
            r.db('cn_chat').tableCreate('agent_ratings').run(connection);
        });
        
    }

    io.sockets.on('connection', function (socket) {

        socket.on('message',function(msg){
            console.log('raw command '+msg.command);
            switch(msg.command){    

                case 'connect' : // when client or agent wants to connect to the chat server
                var $data = {

                        socket_id : socket.id,
                        users_data : msg.users_data,
                        type : msg.type,
                        origin : msg.origin,
                        created_at : new Date()
                };
                console.log(socket.id+' wants to connect');

                r.db('cn_chat').table('connections').insert($data).run(connection, function(err, result) {
                    if( err ) console.log( err )
                    var $users_id = result.generated_keys[0];
                    // tell client that he/she is connected to the chat server and send all available agents
                    if( socketList[socket.id] !== 'undefined' ){
                        io.sockets.connected[socket.id].emit("message", { command : 'connect', result : true, users_id : $users_id } );
                    }
                });

                break;

                case 'register' : // when agent and clients after connected and send their users data

                console.log(socket.id+' wants to register');

                var $raw_usersdata = msg.users_data;
                $raw_usersdata.message = entities.encode($raw_usersdata.message);

                r.db('cn_chat').table('connections').get(msg.users_id).update({ users_data : $raw_usersdata }).run(connection, function(err, result) {
                    if( err ) console.log( err )
                    if( socketList[socket.id] !== 'undefined' ){
                        io.sockets.connected[socket.id].emit("message", { command : 'register', result : true } );
                    }
                });
                break;

                case 'find agent': // when client requesting for a chat request to any available agent
                console.log( socket.id+' is requesting to find agent');
                // return a true response to client
                if( socketList[socket.id] !== 'undefined' ){
                    io.sockets.connected[socket.id].emit('message',{ command : 'find agent', result : true });
                }
                r.db('cn_chat').table('chat_que').insert({ users_id : msg.users_id }).run(connection, function(err, result) {
                    if( err ) console.log( err )

                    // inform all agent
                    r.db('cn_chat').table('connections').filter({ type : 'agent' }).run(connection,function(err,cursor){
                        if( err ) console.log( err )
                        cursor.toArray(function(err,result){
                            if( err ) console.log( err )

                            var $result = result;
                            r.db('cn_chat').table('connections').get(msg.users_id).run(connection,function(err,result){
                                if( err ) console.log( err )

                                for(var $i = 0; $i < $result.length; $i++ ){
                                    if( socketList[$result[$i].socket_id] !== 'undefined' ){
                                        io.sockets.connected[$result[$i].socket_id].emit('message',{ command : 'new client', users_data : result });
                                    }
                                }
                            });
                        });
                    })
                });

                break;

                case 'chat que remove': // after 20 secs, a client will send a 'remove to find agent poll' so he can find an agent again
                console.log( 'chat que remove' );
                r.db('cn_chat').table('chat_que').filter({ socket_id : socket.id }).delete().run(connection, function(err,result){
                    if( err ) console.log( err )
                    if( socketList[socket.id] !== 'undefined' ){
                        io.sockets.connected[socket.id].emit('message',{ command : 'chat que remove', result : true });
                    }
                });

                break;

                case 'get clients' : // when agent requesting to send all clients that are seeking for an agent
                console.log( 'get clients' );
                // when agent request for client list
                r.db('cn_chat').table('chat_que').eqJoin('users_id', r.db('cn_chat').table('connections')).zip().run(connection,function(err,cursor){
                    if( err )  throw err;
                    cursor.toArray(function(err,result){
                        if( socketList[socket.id] !== 'undefined' ){
                            io.sockets.connected[socket.id].emit('message',{ command : 'get clients', clients : JSON.stringify(result) });
                        }
                    });
                });
                break;

                case 'accept chat' : // agent has accepted the chat request
                console.log( 'accept chat' );
                // when agent nor client accepted the chat request
                // create a random session ID
                var $session_id = uniqid();
                var $origin = msg.origin;
                // when agent request a chat to client, remove the client from chat que and activate a chat session
                r.db('cn_chat').table('chat_que').filter({ users_id : msg.client_id }).delete().run(connection,function(err,result){
                    if( err ) console.log( err )

                    // inform all agents immediately except for the client agent
                    r.db('cn_chat').table('connections').filter(r.row('type').eq('agent').and( r.row('socket_id').ne(socket.id) ) ).run(connection,function(err,cursor){
                        if( err ) console.log( err )
                        cursor.toArray(function(err,result){
                            if( err ) console.log( err )
                            for( var $i = 0; $i < result.length; $i++ ){
                                if( socketList[result[$i].socket_id] !== 'undefined' ){
                                    io.sockets.connected[result[$i].socket_id].emit('message',{ command : 'occupied client', client_id : msg.client_id });
                                }
                            }

                        });
                    });

                    // -- insert first message for both client and agent
                    r.db('cn_chat').table('messages').filter({ socket_id : socket.id }).run(connection,function(err,cursor){
                        if( err ) console.log(err);
                        cursor.toArray(function(err,result){
                            if( result.length > 0 ){
                                // insert client first message
                                if( result[0].users_data.message != '' ){
                                    r.db('cn_chat').table('messages').insert({ session_id : $session_id, users_data : result[0], type : 'agent', message : result[0].users_data.message, created_at : new Date() }).run(connection);
                                }
                            }
                        });
                    });
                    // end --

                    r.db('cn_chat').table('connections').get(msg.client_id).run(connection,function(err,result){
                        if( err ) console.log( err )
                        var $result = result;

                        // insert client first message
                        if( $result.users_data.message != '' ){
                            r.db('cn_chat').table('messages').insert({ session_id : $session_id, users_data : $result, type : 'client', message : $result.users_data.message, created_at : new Date() }).run(connection);
                        }
                        // --
                        // delete past session
                        r.db('cn_chat').table('session_ids').filter({ client_id : msg.client_id }).run(connection,function(err,cursor){
                            if( err ) console.log( err )
                            cursor.toArray(function(err,result){
                                if( result.length == 0 ){
                                    r.db('cn_chat').table('connections').filter({ socket_id : socket.id }).run(connection,function(err,cursor){
                                        if( err ) console.log( err )

                                        cursor.toArray(function(err, result){
                                            if( err ) console.log( err )

                                            var $data = result[0];

                                            r.db('cn_chat').table('session_ids').insert({ session_id : $session_id, client_id : msg.client_id, agent_id : $data.id }).run(connection,function(err,result){
                                                if( err ) console.log( err )
                                                // insert to session history table
                                                r.db('cn_chat').table('session_history').insert( { session_id : $session_id, client_data : $result, agent_data : $data }).run(connection);
                                                if( socketList[socket.id] !== 'undefined' ){
                                                    io.sockets.connected[socket.id].emit('message',{ command : 'accept chat', result : true, users_data : $result, session_id : $session_id, sid : $result.socket_id });
                                                }
                                                if( socketList[$result.socket_id] !== 'undefined' ){
                                                    io.sockets.connected[$result.socket_id].emit('message',{ command : 'accept chat', result : true, users_data : $data, session_id : $session_id, sid : socket.id });
                                                }

                                            });
                                        });
                                    });
                                }
                            });
                        });
                    });
                    
                });
     
                break;

                case 'chat message' : // transmit message per individual session
                // when there is a chat message
                console.log( 'chat message' );
                var $message = entities.encode(msg.message);
                var $sid = msg.sid;
                var $type = msg.type;
                var $session_id = msg.session_id;
                var $users_id = msg.users_id;
                var $origin = msg.origin;

                console.log($origin);
                
                // store message to messages collection
                r.db('cn_chat').table('connections').get($users_id).run(connection,function(err,result){
                    r.db('cn_chat').table('messages').insert({ session_id : $session_id, users_data : result, type : $type, origin : $origin,message : $message, created_at : new Date() }).run(connection);
                });

                if( socketList[$sid] !== 'undefined' ){
                    io.sockets.connected[$sid].emit('message',{ command : 'chat message', session_id : $session_id, message : $message });
                }

                break;

                case 'end session' : // when either agent or client choose to end the session
                console.log( 'end session' );
                // when agent nor client ended a chat session
                var $session_id = msg.session_id;
                var $sid = msg.sid;
                var $type = msg.type;

                r.db('cn_chat').table('session_ids').filter({ session_id : $session_id }).run(connection,function(err,cursor){
                    if( err ) console.log( err );

                    cursor.toArray(function(err,result){
                        if( err ) console.log(err);
                        if( result.length > 0 ){
                            var $data = result[0];
                            if( $type === 'client'){
                                r.db('cn_chat').table('connections').get($data.agent_id).run(connection,function(err,result){
                                    if( socketList[$sid] !== 'undefined' ){
                                        io.sockets.connected[$sid].emit('message',{ command : 'end session', result : true, session_id : $session_id });
                                        io.sockets.connected[socket.id].emit('message',{ command : 'end session', result : true, session_id : $session_id, agent_data : result });
                                    }
                                });
                            }else{
                                r.db('cn_chat').table('connections').get(msg.agent_id).run(connection,function(err,result){
                                    if( err ) console.log( err );
                                    if( socketList[$sid] !== 'undefined' ){
                                        io.sockets.connected[$sid].emit('message',{ command : 'end session', result : true, session_id : $session_id, agent_data : result });
                                        io.sockets.connected[socket.id].emit('message',{ command : 'end session', result : true, session_id : $session_id });
                                    }
                                });
                            }
                        }
                        r.db('cn_chat').table('session_ids').filter({ session_id : $session_id }).delete().run(connection);
                    });
                });

                break;

                case 'retrieve chat' : // when agent requesting to retreive messages from a specific chat session
                    var $session_id = msg.session_id;

                    r.db('cn_chat').table('messages').filter({ session_id : $session_id }).orderBy(r.asc('created_at')).run(connection,function(err,cursor){
                        if( err ) console.log( err )
                        cursor.toArray(function(err,result){
                            io.sockets.connected[socket.id].emit('message',{ command : 'retrieve chat', session_id : $session_id, messages : result });
                        });
                    });


                break;

                case 'rate agent': // client rating an agent

                var $data = {
                    ratings : msg.rating,
                    agent_data : msg.agent_data,
                    session_id : msg.session_id,
                    comments : msg.comments
                };
                r.db('cn_chat').table('agent_ratings').insert($data).run(connection,function(err,result){
                    if( err ) console.log( err )

                    io.sockets.connected[socket.id].emit('message',{ command : 'rate agent', result : true });
                });

                break;

                case 'save agent settings':
                // check if alreadt has a settings
                r.db('cn_chat').table('users_settings').filter({ users_id : msg.users_settings.users_id }).run(connection,function(err,cursor){
                    cursor.toArray(function(err,result){
                        if( result.length > 0 ){
                            // then just update
                             r.db('cn_chat').table('users_settings').get(result[0].id).update(
                                 { users_settings : msg.users_settings.users_settings }
                             ).run(connection);
                        }else{
                            // then just insert
                            r.db('cn_chat').table('users_settings').insert(msg.users_settings).run(connection,function(err,result){
                                if( err ) console.log( err );
                                io.sockets.connected[socket.id].emit('message',{ command : 'save agent settings', result : true });
                            });
                        }
                    });
                });

                break;
            }

        });

    });

    io.sockets.on('connection', function (socket) {
        socket.on('disconnect', function () {
            console.log('disconnecting '+socket.id);

            r.db('cn_chat').table('connections').filter({ socket_id : socket.id }).run(connection,function(err,cursor){
                if( err ) console.log(err);

                cursor.toArray(function(err,result){

                    if( result.length > 0 ){ // if theres no result then means client was already ejected from the connections table

                        var $data = result[0]; // store the first result as reference

                        if( $data.type == 'client' ){ // if client

                            r.db('cn_chat').table('chat_que').filter({ client_id : $data.id }).delete().run(connection); // delete from the chat que table
                            // check if client is on session then notify the agent
                            r.db('cn_chat').table('session_ids').filter({ client_id : $data.id }).run(connection,function(err,cursor){
                                if( err ) console.log(err);
                                cursor.toArray(function(err,result){
                                    if( err ) console.log( err );

                                    if( result.length > 0 ){ // if result is not equal to 0 then exist on session ids table
                                        var $result1 = result[0];

                                        // alert the agent participant
                                        r.db('cn_chat').table('connections').filter({ type : 'agent' }).run(connection,function(err,cursor){
                                            if( err ) console.log(err);
                                            cursor.toArray(function(err,result2){
                                                if( err ) console.log(err);
                                                for( var $i = 0; $i < result2.length; $i++ ){
                                                    if( socketList[ result2[$i].socket_id ] !== 'undefined' ){
                                                        io.sockets.connected[result2[$i].socket_id].emit('message',{ command : 'disconnected', client_id : $data.id });
                                                    }
                                                }
                                            });
                                        });
                                    }
                                });
                            });

                            

                        }
                        if( $data.type == 'agent' ){ // if agent
                            // alert all connected clients
                            r.db('cn_chat').table('session_ids').filter({ agent_id : $data.id }).run(connection,function(err,cursor){
                                if( err ) console.log(err);
                                cursor.toArray(function(err,result){
                                    if( err ) console.log(err);
                                    for( var $i = 0; $i < result.length; $i++ ){
                                        var $session_id = result[$i].session_id;
                                        r.db('cn_chat').table('connections').get(result[$i].client_id).run(connection,function(err,result4){
                                            if( err ) console.log(err);
                                            if( result4 != null ){
                                                io.sockets.connected[result4.socket_id].emit('message',{ command : 'disconnected', agent_data : $data, session_id : $session_id });
                                            }
                                        });
                                    }
                                });
                            });
                            
                        }

                        r.db('cn_chat').table('session_ids').filter(r.row('client_id').eq($data.id).or(r.row('agent_id').eq($data.id)) ).delete().run(connection);
                        r.db('cn_chat').table('connections').get($data.id).delete().run(connection);
                    }

                });
            });
            
        });
    });

    setInterval(function(){
        if( connection !== null )
        r.db('cn_chat').table('connections').run(connection,function(err,cursor){
            cursor.toArray(function(err,result){
                for( var $i = 0; $i < result.length; $i++ ){
                    if( socketList[result[$i].socket_id] === undefined ){
                        r.db('cn_chat').table('connections').get(result[$i].id).delete().run(connection);
                    }
                }
            });
        });
    },10000);

    // ---
});





console.log("Listening on port " + port);