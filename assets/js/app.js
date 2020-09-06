var $argos_app;
(function(){
	$argos_app = {
		create : function(){
			this.chatInit();
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
			el.innerHTML = '<img src="assets/img/argos-ball.png" width="64" height="64">';
			document.querySelector('body').appendChild(el);
		},
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
					box-sizing: border-box!important;
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
					cursor:pointer;
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
				.argos-ui h3{
					color:#0099ff;
					font-weight:900;
					margin-bottom:16px!important;
					text-align:center!important;
				}
				.argos-ui.argos-input-wrapper .argos-input-text{
					border:2px solid #ededed!important;
					margin-bottom:0px!important;
					background:none!important;
					padding: 8px !important;
					font-size: 13.5px!important;
					color:#242424!important;
					outline:none!important;
					border-radius: 12px!important;
					width:100%;
				}
				.argos-ui.argos-input-wrapper input,.argos-ui.argos-input-wrapper button{
					outline:none!important;
				}
				.argos-ui.argos-input-wrapper button{
					width:100%;
					display:block;
					color:#FFF!important;
					padding: 8px!important;
					border-radius:12px;
					border:1px solid #0099ff!important;
					background:#0099ff!important;
					border-radius:20px!important;
				}
				.argos-ui.argos-input-wrapper button:hover{
					box-shadow: 0 10px 40px -6px rgba(0,153,255,0.1);
				}
				#argos-convo-box{
					display:none;
				}
				#argos-convo-box.active{
					display:block!important;
				}
				#argos-message-box{
					min-height: 200px;
				    max-height: 330px;
				    overflow-x: hidden;
				    overflow-y: auto;
				    width: 100%;
				}
				#argos-message-box-input{
					position: relative;
				}
				#argos-message-box-input input{
					border: none;
				    border-bottom: 2px solid #ccc;
				    width: 100%;
				    outline: none;
				    width:100%;
				}
				#argos-message-box-input input:focus{
					border-color: #0099FF!important;
				}
				.argos-ui.argos-form-wrapper{
					display:none;
				}
				.argos-ui.argos-form-wrapper.active{
					display:block!important;
				}
				.lds-ellipsis {
				  display: table;
				  position: relative;
				  width:80px;
				  margin:0px auto;
				}
				.lds-ellipsis div {
				  position: absolute;
				  top: 0px;
				  width: 13px;
				  height: 13px;
				  border-radius: 50%;
				  background: #0099ff;
				  animation-timing-function: cubic-bezier(0, 1, 1, 0);
				}
				.lds-ellipsis div:nth-child(1) {
				  left: 8px;
				  animation: lds-ellipsis1 0.6s infinite;
				}
				.lds-ellipsis div:nth-child(2) {
				  left: 8px;
				  animation: lds-ellipsis2 0.6s infinite;
				}
				.lds-ellipsis div:nth-child(3) {
				  left: 32px;
				  animation: lds-ellipsis2 0.6s infinite;
				}
				.lds-ellipsis div:nth-child(4) {
				  left: 56px;
				  animation: lds-ellipsis3 0.6s infinite;
				}
				@keyframes lds-ellipsis1 {
				  0% {
				    transform: scale(0);
				  }
				  100% {
				    transform: scale(1);
				  }
				}
				@keyframes lds-ellipsis3 {
				  0% {
				    transform: scale(1);
				  }
				  100% {
				    transform: scale(0);
				  }
				}
				@keyframes lds-ellipsis2 {
				  0% {
				    transform: translate(0, 0);
				  }
				  100% {
				    transform: translate(24px, 0);
				  }
				}
				#argos-loader{
					display:none;
					background: rgba(255,255,255,0.8);
					position: absolute;
				    width: 100%;
				    height: calc(100% - 20px);
				    align-items: center;
				    justify-content: center;
				    z-index:999;
				    top:0px;
				    left:0px;
				}
				#argos-loader.active{
					display:flex!important;
				}
				#argos-loader p{
					margin: 0px 0px 12px 0px;
				    font-size: 13px;
				    opacity: .8;
				    text-align: center;
				}
			`;
			document.querySelector('head').appendChild(el);
		},
		loader : {
			show : function(p,c){
				document.querySelector('#argos-loader').classList.add('active');

				if( typeof p != 'undefined' ){
					document.querySelector('#argos-loader p').innerHTML = p;
				}
				
				if( typeof c == 'function' ){
					setTimeout( function(){
						c();
					},300);
				}
			},
			hide : function(c){
				document.querySelector('#argos-loader').classList.remove('active');
				document.querySelector('#argos-loader p').innerHTML = '';
				if( typeof c == 'function' ){
					setTimeout( function(){
						c();
					},300);
				}
			}
		},
		agentData : function(s){
			if( typeof s != 'undefined' && typeof s == 'object' ){
				document.querySelector('#argos-chat-agent-data').value = JSON.stringify(s);
			}else{
				return JSON.parse(document.querySelector('#argos-chat-agent-data').value);
			}

		},
		initForm : function(){
			let el = document.createElement('div');
			el.setAttribute('id','argos-form');
			el.classList.add('argos','argos-form','argos-ui');
			el.innerHTML = `<div id="argos-loader"><div><p></p><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div></div>
			<h3>Argos Chat</h3>
			<div id="argos-convo-box" class="argos argos-ui">
				<input type="hidden" id="argos-chat-agent-data" value="" style="display:none">
			    <div id="argos-message-box" class="argos argos-ui"></div>
		        <div id="argos-message-box-input" class="argos argos-ui">
		        	<input type="text" class="argos argos-ui argos-input-text" placeholder="Type message, enter to send...">
		        </div>
			</div>
			<div class="argos-ui argos argos-form-wrapper active">
				<div class="argos-ui argos argos-input-wrapper">
					<input type="text" placeholder="First name" name="fname" data-alias="First name" class="argos argos-ui argos-input argos-input-text" data-validate="required">
				</div>
				<div class="argos-ui argos argos-input-wrapper">
					<input type="text" placeholder="Last name" name="lname" class="argos argos-ui argos-input argos-input-text">
				</div>
				<div class="argos-ui argos argos-input-wrapper">
					<input type="email" placeholder="Email" name="email" data-alias="Email" class="argos argos-ui argos-input argos-input-text" data-validate="required,email">
				</div>
				<div class="argos-ui argos argos-input-wrapper">
					<textarea row="3" col="2" placeholder="Message" name="message" class="argos argos-ui argos-input argos-input-text"></textarea>
				</div>
				<div class="argos-ui argos argos-input-wrapper">
					<button class="argos argos-ui argos-button" onclick="window.$argos_app.startChat()">Submit</button>
				</div>
			</div>`;

			document.querySelector('body').appendChild(el);
		},
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

				let _this = this;

				let isclean = true;

				document.querySelectorAll('#argos-form [data-validate]').forEach(function(item){
					let arr = item.getAttribute('data-validate').split(',');

					let err = [];

					arr.forEach(function(item2){
						let res = _this.validation.find(function(item){
							return item.type == item2.trim();
						});

						let q = res.task(item.value);

						if( typeof res == 'undefined' ){
							err.push('Validation for '+item2+' not found');
						}else if( !q ){
							err.push( q.message.replace('{alias}',item.getAttribute('data-alias')));
						}
					});

					if( err.length > 0 ){
						alert(err.join(','));
						isclean = false
					}
				});

				return isclean;
			}
		},
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
					message : document.querySelector('#argos-form textarea[name="message"]').value
				}
			});
		},
		formState : function(s){
			if( typeof s == 'undefined' || !s ){
				document.querySelector('#argos-form .argos-form-wrapper').style.opacity = '.5';
				document.querySelector('#argos-form input[name="fname"]').disabled = true;
				document.querySelector('#argos-form input[name="lname"]').disabled = true;
				document.querySelector('#argos-form input[name="email"]').disabled = true;
				document.querySelector('#argos-form textarea[name="message"]').disabled = true;
				document.querySelector('#argos-form button').textContent = 'Starting chat...';
				document.querySelector('#argos-form button').disabled = true;
			}else{
				document.querySelector('#argos-form .argos-form-wrapper').style.opacity = '1';
				document.querySelector('#argos-form input[name="fname"]').disabled = false;
				document.querySelector('#argos-form input[name="lname"]').disabled = false;
				document.querySelector('#argos-form input[name="email"]').disabled = false;
				document.querySelector('#argos-form textarea[name="message"]').disabled = false;
				document.querySelector('#argos-form button').textContent = 'Chat Now';
				document.querySelector('#argos-form button').disabled = false;
			}
		},
		showConvo : function(){
			document.querySelector('.argos-ui.argos-form-wrapper').classList.remove('active');
			document.querySelector('#argos-convo-box').classList.add('active');
		},
		showForm : function(){
			document.querySelector('#argos-convo-box').classList.remove('active');
			document.querySelector('.argos-ui.argos-form-wrapper').classList.add('active');
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
						_this.formState(true);
					}else{
						alert('Unable to connect to server');
					}
					break;
					case 'register' :
						_this.formState(true);
						if( res.success ){
							socket.emit('argos',{
								type : 'chat'
							});
							_this.loader.show('Finding agent...');
							_this.showConvo();
						}else{
							alert('Unable to authenticate to server');
						}
					break;
					case 'find agent':
						if( res.success ){
							// prepare, save the data to head
							_this.agentData(res.data);
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

	$argos_app.create();
})();