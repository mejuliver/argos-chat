const r = require('rethinkdb');
const passwordHash = require('password-hash');
const path = require('path');
const rethinkdb_con = require(path.join(__dirname, '../helpers/rethinkdb-connect.js'));

exports.login = (u,p,f) => {
	rethinkdb_con.connect(function(err,conn){
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
	});
}