const path = require('path');
const account_model = require(path.join(__dirname, '../models/account_model.js'));

exports.login = (u,p,f)=>{
	account_model.login(u,p,(res)=>{
		// activate cookie
		if( typeof f == 'function' ){
			f(res);
		}
	});	
}