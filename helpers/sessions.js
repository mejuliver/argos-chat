const r = require('rethinkdb');
let uniqid = require('uniqid');
let con = false;

r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
  	if(err){
	  	throw err; // throw error
  	}else{
  		con = conn;
  	}
});



exports.create = (data,f)=>{
	if( con && data.hasOwnProperty('expiration')){
		r.db('argosdb').table('sessions').insert({
			sess_key : uniqid(),
			type : ( data.hasOwnProperty('type') ? data.type : 'default'),
			body : ( data.hasOwnProperty('body') ? data.body : ''),
			expiration : data.expiration,
			created : moment()
		}).run(con).then(function(){
			if( typeof f == 'function' ){
				f({
					success : true
				})
			}
		}).catch(function(err){
			if( typeof f == 'function' ){
				f({
					success : false,
					msg : err
				})
			}
		});
	}
}

exports.get = (name,f)=>{
	if( con ){
		r.db('argosdb').table('sessions').filter(r.row('name').eq(name)).run(con).then(function(res){
			res.toArray(function(err,result){
				let data_res = false
				if( result.length > 0 ){
					data_res = result[0];
				}

				if( typeof f == 'function' ){
					f(data_res)
				}
			});
		});
	}
}

exports.check = (name,f) => {
	if( con ){
		r.db('argosdb').table('sessions').filter(r.row('name').eq(name)).run(con).then(function(res){
			res.toArray(function(err,result){
				let data_res = {
					success : false,
					'msg' : 'Session not found'
				}
				if( result.length > 0 ){
					let etype = false;

					if( result[0].expiration.indexOf('m') != -1 ){
						etype = {
							type : 'minute',
							value : parseInt(result[0].expiration)
						}
					}else if( result[0].expiration.indexOf('d') != -1 ){
						etype = {
							type : 'hours',
							value : parseInt(result[0].expiration)
						}
					}else if( result[0].expiration.indexOf('d') != -1 ){
						etype = {
							type : 'day',
							value : parseInt(result[0].expiration)
						}
					}

					if( etype ){
						switch( etype.type ){
							case 'minute' :
								let d = moment(etype.value).format('mm');
								
							break;
						}
					}
				}

				if( typeof f == 'function' ){
					f(data_res)
				}
			});
		});
	}
}