var $app;
(function(){
	app = {
		create : function(){
			// authenticate
			if( window.isAuthenticated ){

			}else{
				this.showForm();
			}
		},
		chatInit : function(){
			// when connected unto the server
			socket.on('connect',function(){

			});

			// when not connected on the server, error
			socket.on('connect_error',function(){

			});

			// when server sent a message
			socket.on('message',function(){

			});
		},
		showForm : function(){
			
		}

	}

	app.create();
})();