var $argos_app;
(function(){
	$argos_pp = {
		create : function(){
			this.chatInit();
			this.connect();
			this.initStyle();
			this.initBall();
			this.initForm();
		},
		initBall : function(){
			let _this = this;
			let el = document.createElement('div');
			el.setAttribute('id','argos-ball');
			el.onclick = function(){
				if( document.querySelector('#argos-form').classList.contains('active') ){
					_this.toggleForm(false);
				}else{
					_this.toggleForm(true);
				}
			}
			el.innerHTML = '<img src="/../img/argos-ball.png width="64" height="64">';
			document.querySelector('body').appendChild(el);
		}
		initStyle : function(){
			el = document.createElement('style');
			el.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap';
			el.rel = "stylesheet";
			document.querySelector('head').appendChild(el);

			el = document.createElement('style');
			el.type = "text/css";
			el.media = "all"
			el.innerHTML = `
				#argos-form, #argos-form *,#argos-ball{
					font-family: 'Roboto', sans-serif!important;
					border-sizing: border-box!important;
				}
				#argos-ball{
					width:64px;
					height:64px;
					position:fixed;
					top:initial;
					bottom:20px;
					left:initial;
					right:20px;
					z-index:1;
					display:block;
				}
				#argos-form.active{
					display:block!important;
				}
				#argos-form{
					display:none;
					width:350px;
					z-index:2;
					position:fixed;
					top:initial;
					bottom:20px;
					left:initial;
					right:20px;
					background:#FFF;
					border-radius:12px;
					padding:24px;
					box-shadow: 0 10px 40px -6px rgba(0, 0, 0, 0.1);
				}
				.argos-ui.argos-input-wrapper{
					position:relative;
					width:100%;
					margin-bottom:12px;
				}
				.argos-ui.argos-input-wrapper:last-child{
					margin-bottom:0px!important;
				}
				.argos-ui.argos-input-wrapper h3{
					margin-bottom:16px!important
					text-align:center!important;
				}
				.argos-ui.argos-input-wrapper input{
					border:2px solid #ededed!important;
					margin-bottom:0px!important;
					background:none!important;
					padding: 8px !important;
					font-size: 13.5px!important;
					color:#242424!important;
					outline:none!important;
					border-radius:12px;
				}
				.argos-ui.argos-input-wrapper input,.argos-ui.argos-input-wrapper button{
					outline:none!important;
				}
				.argos-ui.argos-input-wrapper button{
					width:100%;
					display:block;
					padding: 12px 8px!impotant;
					border-radius:12px;
					border:1px solid #0099ff!important;
					background:#0099ff!important;
				}
				.argos-ui.argos-input-wrapper button:hover{
					box-shadow: 0 10px 40px -6px rgba(0,153,255,0.1);
				}
			`;
			document.querySelector('head').appendChild(el);
		},
		initForm : function(){
			let el = document.createElement('div');
			el.setAttribute('id','argos-form');
			el.classList.add('argos','argos-form','argos-ui');
			el.innerHTML = `<div class="argos-ui argos argos-form-wrapper">
				<div class="argos-ui argos argos-input-wrapper">
					<h3>Argos Chat</h3>
				</div>
				<div class="argos-ui argos argos-input-wrapper">
					<input type="text" placeholder="First name" name="fname" data-alias="First name" class="argos argos-ui argos-input argos-input-text" data-validate="required">
				</div>
				<div class="argos-ui argos argos-input-wrapper">
					<input type="text" placeholder="Last name" name="lname" class="argos argos-ui argos-input argos-input-text">
				</div>
				<div class="argos-ui argos argos-input-wrapper">
					<input type="email" placeholder="Email" name="email" data-alias="Email" class="argos argos-ui argos-input argos-input-text" data-validate="required">
				</div>
				<div class="argos-ui argos argos-input-wrapper">
					<textarea row="3" col="2" placeholder="First name" name="message" class="argos argos-ui argos-input argos-input-textarea"></textarea>
				</div>
				<div class="argos-ui argos argos-input-wrapper">
					<button class="argos argos-ui argos-button" onclick="window.$argos_app.startChat()">Submit</button>
				</div>
			</div>`;

			document.querySelector()
		}
		validateForm : {
			validation : [
				{
					type : 'required',
					task : function(v){
						if( typeof v != 'undefined' && v.trim() != '' ){
							return true;
						}else{
							return false;
						}
					},
					message : '{alias} is required'
				},
				{
					type : 'email',
					task : function(v){
						let validEmail = function(email) {
                            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            return re.test(email);
                        }

						if( typeof v != 'undefined' && validEmail(v) ){
							return true;
						}else{
							return false;
						}
					},
					message : '{alias} is invalid email'
				}
			],
			check : function(t,v){

				let has_error = false;

				document.querySelectorAll('#argos-form [data-validate]').forEach(function(item){
					let arr = item.getAttribute('data-validate').split(',');

					let err = [];

					arr.forEach(function(item2){
						let res = this.validation.find(function(item){
							return item.type == t;
						});

						let q = res.task(item.trim(),item.value);

						if( typeof res == 'undefined' ){
							err.push('Validation for '+item2+' not found');
						}else if( !q ){
							err.push( q.message.replace('{alias}',item.getAttribute('data-alias')));
						}
					});

					if( err.length > 0 ){
						alert(err.join(','));
						has_error = true;
					}
				});

				return has_error;
			}
		}
		startChat : function(){
			if( !this.validateForm.check() ){
				return;
			}

			this.formState();

			socket.emit('argos',{
				type : 'register',
				msg : {
					fname : document.querySelector('#argos-form input[name="fname"]').value,
					lname : document.querySelector('#argos-form input[name="lname"]').value,
					email : document.querySelector('#argos-form input[name="email"]').value,
					message : document.querySelector('#argos-form input[name="message"]').value
				}
			});
		},
		formState : function(s){
			if( typeof s == 'undefined' || !s ){
				document.querySelector('#argos-form input[name="fname"]').disabled = true;
				document.querySelector('#argos-form input[name="lname"]').disabled = true;
				document.querySelector('#argos-form input[name="email"]').disabled = true;
				document.querySelector('#argos-form input[name="message"]').disabled = true;
				document.querySelector('#argos-form button').textContent = 'Starting chat...';
				document.querySelector('#argos-form button').disabled = true;
			}else{
				document.querySelector('#argos-form input[name="fname"]').disabled = false;
				document.querySelector('#argos-form input[name="lname"]').disabled = false;
				document.querySelector('#argos-form input[name="email"]').disabled = false;
				document.querySelector('#argos-form input[name="message"]').disabled = false;
				document.querySelector('#argos-form button').textContent = 'Chat Now';
				document.querySelector('#argos-form button').disabled = false;
			}
		},
		connect : function(){
			socket.emit('argos',{
				type : 'connect'
			});
		},
		chatInit : function(){
			let _this = this;
			// when connected unto the server
			socket.on('connect',function(){
				console.log('Client connected');
			});
			// when not connected on the server, error
			socket.on('connect_error',function(){
				console.log('Client disconnected');
			});

			// when server sent a message
			socket.on('argos',function(res){
				switch( res.type ){
					case 'connect' :
					if( res.success ){
						_this.showForm();
					}else{
						alert('Unable to connect to server');
						this.formState(true);
					}
					
					break;
					case 'register'
						if( res.success ){
							socket.emit('argos',{
								type : 'chat'
							});
						}else{
							alert('Unable to authenticate to server');
							this.formState('on');
						}
					break;
				}
			});
		},
		toggleForm : function(ison){
			if( typeof ison == 'undefined' || !ison ){
				document.querySelector('#argos-form').classList.remove('active');
			}else{
				document.querySelector('#argos-form').classList.add('active');
			}
		}

	}

	$app_argos.create();
})();