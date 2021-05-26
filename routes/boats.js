const express = require('express');
const app = express();
const bodyParser = require('body-parser');

var ds_boat=require('./../app/models/Boat');
var ds_load=require('./../app/models/Load');
var ds=require('./../lib/datastore/datastore_functions');
var ds_e=require('./../lib/datastore/datastore_entity');
var jwt=require('./../lib/middleware/checkjwt');
var ds_request=require('./boats_loads');
var validate=require('./../lib/validation/json_val');
var client=require('./../lib/error/client_error');
const verify_jwt=jwt.verify;
const _ds=require('./../lib/datastore/datastore')
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

const BOATS='boats';
const BOAT='Boat'
const LOADS='loads';
const LOAD='Load';

function getBoats(req,callback,callback_params){
	return ds_request.get_entities(BOAT, req, callback,callback_params,new ds_boat.Boat()).then((results)=>{
			results.items.map((boat)=>{
				if (boat.loads){
					boat.loads=ds.map_id_self_only(boat.loads, new ds_load.Load(),req);
				}
				return boat;
			})
			return results;
		})
}

function getBoat(req,userid){
	var boat_id=req.params.boat_id;
	var q=[['__key__', '=', _ds.datastore.key(['Boat', parseInt(boat_id,10)])],['owner','=',userid]];
	var err=new client.forbidden(BOAT + ' with id ' + boat_id + ' with owner ' + userid +  ' does not exist');
	var query=ds.getEntitiesByProperties(BOAT,q);
	console.log(query);
	return ds.query(query).then((data)=>{
		var boat=data[0];
		if (boat[0]){
			var get_boat=ds.map_all_properties(boat,new ds_boat.Boat(),req)[0];
			if (get_boat.loads != null){
				get_boat.loads=ds.map_id_self_only(get_boat.loads, new ds_load.Load(),req);
			}
			return get_boat;
		}
		throw err;
	});
}

function createBoat(req,userid){
	req.body.loads=null;
	req.body.owner=userid;
	return ds_request.post_entity(req,BOAT,new ds_boat.Boat()).then((results)=>{
		console.log(results);
		return results[0];
	})
}

function assignLoadToBoat(req,userid){
	var boat_id=req.params.boat_id
	var load_id=req.params.load_id;
	var err=new client.forbidden(BOAT + ' with id ' + boat_id + ' with owner ' + userid + ' and load ' + load_id + ' does not exist');
	var q1=[['__key__', '=', _ds.datastore.key(['Boat', parseInt(boat_id,10)])],['owner','=',userid]];
	var q2=[['__key__', '=', _ds.datastore.key(['Load', parseInt(load_id,10)])]];
	return ds_request.addToEntity(q1,BOAT,LOADS,boat_id, q2,LOAD,'carrier',load_id,err);
}

function removeLoadFromBoat(req,userid){
	var boat_id=req.params.boat_id
	var load_id=req.params.load_id;
	var err=new client.forbidden(BOAT + ' with id ' + boat_id + ' with owner ' + userid + ' and load '+ load_id + ' does not exist');
	var q1=[['__key__', '=', _ds.datastore.key([BOAT, parseInt(boat_id,10)])],['owner','=',userid]];
	var q=ds.getEntitiesByProperties(BOAT,q1);
	return ds.query(q).then((list)=>{
		var boat=list[0]
		if(boat[0]){
			if(boat[0].loads!=null){
				 return ds_request.removeFromEntityArray(boat[0].loads,LOAD,'carrier',is_equal,parseInt(load_id,10),err).then((index)=>{
					 boat[0].loads.splice(index,1);
					 if (boat[0].loads.length==0){
						 boat[0].loads=null
					 }
					 return ds.updateEntity(boat[0]);			
				})
			}
			console.log('boat.loads=null')
			throw err;
		}
		console.log('no boat with boat_id')
		throw err;
	});
}

function deleteBoat(req,userid){
	var boat_id=req.params.boat_id
	var q1=[['__key__', '=', _ds.datastore.key([BOAT, parseInt(boat_id,10)])],['owner','=',userid]];
	var q=ds.getEntitiesByProperties(BOAT,q1);
	var err=new client.forbidden(BOAT + ' with id ' + boat_id + ' with owner ' + userid +  ' does not exist');
	return ds.query(q).then((list)=>{
		var boat=list[0]
		if(boat[0]){
			if(boat[0].loads){
				return ds_request.removeFromEntityArray(boat[0].loads,LOAD,'carrier',null,null,err).then(()=>{
					return ds.deleteEntity(BOAT,parseInt(boat_id,10));
				})	
			}
			return ds.deleteEntity(BOAT,parseInt(boat_id,10));
		}
		throw err;	
	})
}

function patchBoat(req,userid){
	var boat_id=req.params.boat_id;
	var err=new client.forbidden(BOAT + ' with id ' + boat_id + ' with owner ' + userid + ' does not exist');
	var q1=[['__key__', '=', _ds.datastore.key([BOAT, parseInt(boat_id,10)])],['owner','=',userid]];
	return ds_request.patch_entity(BOAT,req.body,q1,err).then((boat)=>{
		if (boat[0]){
			var get_boat=ds.map_all_properties(boat,new ds_boat.Boat(),req)[0];
			if (get_boat.loads != null){
				get_boat.loads=ds.map_id_self_only(get_boat.loads, new ds_load.Load(),req);
			}
			return get_boat;
		}
		throw err;
	})
}


//INCLUDE PAGENATION
//INCLUDE PAGENATION
app.get('/',verify_jwt,function(req,res){
	if (res.locals.error=='bad jwt'){
		validate.acceptsJson(req);
		var callback=ds.getAll;
		var callback_params=[BOAT]
		return getBoats(req,callback,callback_params).then((results)=>{
			console.log('auth');
			console.log(results);
			res.status(200).json(results);
		})
	}
	else{
		var callback=ds.getEntitiesByProperty;
		var callback_params=[[BOAT],['owner','=',res.locals.userid]];
		validate.acceptsJson(req);
		return getBoats(req,callback,callback_params).then((results)=>{
			console.log('auth');
			console.log(results);
			res.status(200).json(results);
		})
	}

})



app.get('/:boat_id',verify_jwt,(req,res,next)=>{
	if (res.locals.userid){
		validate.acceptsJson(req);
		return getBoat(req,res.locals.userid).then((results)=>{
			res.status(200).json(results)
		}).catch((error)=>{
			next(error);
		})
	}
	throw new client.unauthorized('Invalid authentication credentials');	
})


app.post('/',verify_jwt,(req,res,next)=>{
	if (res.locals.userid){
		validate.isJson(req);
		validate.acceptsJson(req);
		return createBoat(req,res.locals.userid).then((results)=>{
			res.status(201).json(results)
		}).catch((error)=>{
			next(error);
		})
	}
	throw new client.unauthorized('Invalid authentication credentials');	
})


//can only modify (name, length, type)
//can only modify (name, length, type)
app.patch('/:boat_id',verify_jwt,(req,res,next)=>{
	if (res.locals.userid){
		validate.isJson(req);
		validate.acceptsJson(req);
		return patchBoat(req,res.locals.userid).then((data)=>{
			res.status(200).json(data);	
		}).catch((error)=>{
			next(error);
		})
	}
	throw new client.unauthorized('Invalid authentication credentials');	
})


app.put('/:boat_id',verify_jwt,(req,res,next)=>{
	if (res.locals.userid){
		validate.isJson(req);
		return patchBoat(req,res.locals.userid).then(()=>{
			res.status(204).send();	
		}).catch((error)=>{
			next(error);
		})
	}
	throw new client.unauthorized('Invalid authentication credentials');	
})


//delete boat
app.delete('/:boat_id',verify_jwt,(req,res,next)=>{
	if (res.locals.userid){
		return deleteBoat(req,res.locals.userid).then(()=>{
			res.status(204).send()
		}).catch((error)=>{
			next(error);
		})
	}
	throw new client.unauthorized('Invalid authentication credentials');	
});


function is_equal(val1,val2){
	if(val1==val2){
		return true;
		console.log('is_equal returning true')
	}
	return false;
}


//remove load from boat
app.delete('/:boat_id/loads/:load_id',verify_jwt,(req,res,next)=>{
	if (res.locals.userid){
		return removeLoadFromBoat(req,res.locals.userid).then(()=>{
			return res.status(204).send()
		}).catch((error)=>{
			next(error);
		})
	}
	throw new client.unauthorized('Invalid authentication credentials');	
});

app.put('/:boat_id/loads/:load_id',verify_jwt,(req,res,next)=>{	
	if (res.locals.userid){
		return assignLoadToBoat(req,res.locals.userid).then(()=>{
			res.status(204).send();
		}).catch((error)=>{
			next(error);
		});
	}
	throw new client.unauthorized('Invalid authentication credentials');	
})


/*** CANNOT DELETE ALL BOATS ***/
app.delete('/' , function(req, res){
	res.set("Allow", "GET, POST");
	throw new client.method_not_allowed("DELETE " + req.protocol +"://" + req.get("host") + '/' + 'boats'+ ' is not an acceptable request');
});

/*** CANNOT patch ALL BOATS ***/
app.patch('/' , function(req, res){
	res.set("Allow", "GET, POST");
	throw new client.method_not_allowed("PATCH " + req.protocol +"://" + req.get("host") + '/' + 'boats'+ ' is not an acceptable request');
});


/*** CANNOT put ALL BOATS ***/
app.put('/' , function(req, res){
	res.set("Allow", "GET, POST");
	throw new client.method_not_allowed("PUT " + req.protocol +"://" + req.get("host") + '/' + 'boats'+ ' is not an acceptable request');
});

module.exports=app;