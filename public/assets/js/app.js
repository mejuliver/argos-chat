(function(){
	({
		create : function(){
			this.initValidation();
			this.initForm();
		},
		initForm : function(){
			let _this = this;

			document.querySelector('#login-form #login-btn').addEventListener('click',function(){
				event.preventDefault();
				document.querySelectorAll('[data-validate]').forEach(function(item){
					let arr = item.getAttribute('data-validate').split(',');

					arr.forEach(function(e){
						_this.validate(item,e.trim());
					});
	          	});

	          	if( document.querySelectorAll('#login-form .dirty').length == 0 ){

	          		let data = {
	          			email : document.querySelector('#login-form input[name="email"]').value,
	          			password : document.querySelector('#login-form input[name="password"]').value
	          		}

	          		fetch('http://localhost:3700/do-login',{
	          			method : 'post',
	          			body : JSON.stringify(data),
	          			headers: {
						    'Content-Type': 'application/json'
						},
	          		}).then(function(response) {
				    	return response.json();
				  	}).then(function(data) {
				    	console.log(data);
				  	});
				}
			});
		},
		getCurrentDate : function(t){
            let today = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            let yyyy = today.getFullYear();


            if( typeof t == 'undefined' || t == 'today' ){
                return $today = mm + '/' + dd + '/' + yyyy;
            }

            if( t == 'day' ){
                return dd;
            }

            if( t == 'year' ){
                return yyyy;
            }

            if( t == 'month' ){
                return mm;
            }
        },
        debounce : function(func, wait, immediate) {

          var timeout;

          return function() {
              var context = this, args = arguments;
              var later = function() {
                  timeout = null;
                  if (!immediate) func.apply(context, args);
              };

              var callNow = immediate && !timeout;
              clearTimeout(timeout);
              timeout = setTimeout(later, wait);
              if (callNow) func.apply(context, args);
          };
        },
        loadScript : function(src, callback){
            var s,
                r,
                t;
                r = false;
                s = document.createElement('script');
                s.type = 'text/javascript';
                s.src = src;
                s.onload = s.onreadystatechange = function() {
                //console.log( this.readyState ); //uncomment this line to see which ready states are called.
                if ( !r && (!this.readyState || this.readyState == 'complete') ){
                  r = true;
                  if( typeof callback == 'function' ){
                    callback();
                  }
                }
            };
            t = document.getElementsByTagName('script')[0];
            t.parentNode.insertBefore(s, t);
        },
        encodeHTML : function(str){
            var map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return str.replace(/[&<>"']/g, function(m) {return map[m];});
        },
        decodeHTML : function(str){
            var map ={
                '&amp;': '&',
                '&lt;': '<',
                '&gt;': '>',
                '&quot;': '"',
                '&#039;': "'"
            };
            return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, function(m) {return map[m];});
        },
        wrap : function(el, wrapper) {
		    el.parentNode.insertBefore(wrapper, el);
		    wrapper.appendChild(el);
		},
        initValidation : function(){
        	let _this = this;
          	document.querySelectorAll('[data-validate]').forEach(function(item){
          		let el = document.createElement('div');
          		el.classList.add('validate-wrapper');
          		_this.wrap(item,el);
          	});  
        },
        validate : function(el,t){
            let res = this.validations.find(function(e){
                return e.name == t;
            });
            
            if( res != 'undefined' ){
               res.task(el);
            }
        },
        validations : [
            {
                name : 'email',
                task : function(el){

                    let isInvalidEmail = function(email){
                        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        return re.test(email);
                    }
                    
                    if( el.closest('.validate-wrapper').querySelector('.error') ){
                		el.closest('.validate-wrapper').querySelector('.error').remove();
                	}
                    
                    if( el.value != '' && !isInvalidEmail( el.value ) ){
                        setTimeout( function(){
                            el.classList.add('dirty');
                            el.closest('.validate-wrapper').insertAdjacentHTML('afterbegin','<p class="error " style="font-size:11px;color: #e25b5b;margin-bottom:4px;">'+el.getAttribute('data-alias')+' is invalid email'+'</p>');
                        },10);
                    }else{
                        el.classList.remove('dirty');
                    }
                }
            },
            {
                name : 'required',
                task : function(el){
                	if( el.closest('.validate-wrapper').querySelector('.error') ){
                		el.closest('.validate-wrapper').querySelector('.error').remove();
                	}
                    if( el.value == '' ){
                        setTimeout( function(){
                            el.classList.add('dirty');
                            el.closest('.validate-wrapper').insertAdjacentHTML('afterbegin','<p class="error" style="font-size:11px;color: #e25b5b;margin-bottom:4px;">'+el.getAttribute('data-alias')+' is required'+'</p>');
                        },10);
                    }else{
                        el.classList.remove('dirty');
                    }
                }
            }
        ],
	}).create();
})();