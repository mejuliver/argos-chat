const r = require('rethinkdb');

exports.connect = (f)=>{
	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
	  	if(err){
		  	throw err; // throw error
	  	}else{
	  		console.log(1);
		  	if( typeof f != 'undefined'){
		  		f(err,conn);
		  	}
  		}
	});
}