const r = require('rethinkdb');
const passwordHash = require('password-hash');


exports.login = (u,p,f) => {
	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
	  	if(err){
		  	throw err; // throw error
	  	}else{
		  	r.db('argosdb').table('admin').filter(r.row('email').eq(u)).run(conn).then((res)=>{
				res.toArray((err,result)=>{
					let success = false;
					let msg = 'Invalid username or password';
					
					if( result.length > 0 ){
						if( passwordHash.verify(p, result[0].password) ){
							success = true;
							msg = 'Successfully authenticated';
						}
					}else{
						msg = 'Account not found';
					}

					if( typeof f == 'function' ){
						f({
							success : success,
							msg : msg
						});
					}
				})
			});
  		}
	});
}