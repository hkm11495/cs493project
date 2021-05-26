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
const _ds=require('./../lib/datastore/datastore')
const verify_jwt=jwt.verify;
var client=require('./../lib/error/client_error');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());


const BOATS='boats';
const BOAT='Boat'
const LOADS='loads';
const LOAD='Load';

function boat_loads_empty(boat_loads){
	if(boat_loads==[]){
		boat_loads=null;
	}
}


function getDate(){
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0'); 
	var yyyy = today.getFullYear();

	today = mm + '/' + dd + '/' + yyyy;
	return today;
}

function getLoads(req){
	return ds_request.get_entities(LOAD, req, ds.getAll,[LOAD],new ds_load.Load()).then((results)=>{
		console.log(results);
		results.items.map((load)=>{
			if (load.carrier){
				load.carrier=ds.map_id_self_only([load.carrier], new ds_boat.Boat(),req);
				return load;
			}
		})
		return results;
	})
}


function getLoad(req){
	var load_id=req.params.load_id;
	var q=[['__key__', '=', _ds.datastore.key([LOAD, parseInt(req.params.load_id,10)])]];
	var err=new client.not_found(LOAD + ' with id ' + load_id + ' does not exist');
	var query=ds.getEntitiesByProperties(LOAD,q)
	return ds.query(query).then((data)=>{
		var load=data[0];
		if (load[0]){
			var get_load=ds.map_all_properties(load,new ds_load.Load(),req)[0];
			if (get_load.carrier != null){
				get_load.carrier=ds.map_id_self_only([get_load.carrier], new ds_boat.Boat(),req)[0];
			}
			return get_load;
		}
		throw err;
	});
}

function patchLoad(req){
	var load_id=req.params.load_id;
	var err=new client.not_found(LOAD + ' with id ' + load_id + ' does not exist');
	var q1=[['__key__', '=', _ds.datastore.key([LOAD, parseInt(load_id,10)])]];
	return ds_request.patch_entity(LOAD,req.body,q1,err).then((load)=>{
		if (load[0]){
			var get_load=ds.map_all_properties(load,new ds_load.Load(),req)[0];
			if (get_load.carrier != null){
				get_load.carrier=ds.map_id_self_only([get_load.carrier], new ds_boat.Boat(),req)[0];
			}
			return get_load
		}
		throw err;
	})
}

function createLoad(req){
	req.body.creation_date=getDate();
	req.body.carrier=null;
	return ds_request.post_entity(req,LOAD,new ds_load.Load());
}


function deleteLoad(req){
	var load_id=req.params.load_id;
	var q1=[['__key__', '=', _ds.datastore.key([LOAD, parseInt(load_id,10)])]];
	var q=ds.getEntitiesByProperties(LOAD,q1);
	var err=new client.not_found(LOAD + ' with id ' + load_id + ' does not exist');
	return ds.query(q).then((list)=>{
		var load=list[0]
		if(load[0]){
			if (load[0].carrier){
				return ds.getEntityByID(BOAT,parseInt(load[0].carrier,10)).then((boat)=>{
					console.log(boat);
					return ds_request.removeFromEntityArray(boat.loads,LOAD,'carrier',is_equal,load_id,err).then((index)=>{
						console.log(index);
						 boat.loads.splice(index,1);
						 console.log('new boat.loads after splce: ' + boat.loads)
						 if (boat.loads.length==0){
							 boat.loads=null
						 }
						 return ds.updateEntity(boat).then(()=>{
							 return ds.deleteEntity(LOAD,parseInt(load_id,10));
						 });
					})
				});
			}
			return ds.deleteEntity(LOAD,parseInt(load_id,10));
		}
	throw err;
	})
}

//INCLUDE PAGENATION
//INCLUDE PAGENATION
app.get('/',function(req,res){
	validate.acceptsJson(req);
	return getLoads(req).then((results)=>{
		res.status(200).json(results);
	})
})


app.get('/:load_id',(req,res,next)=>{
	validate.acceptsJson(req);
	return getLoad(req).then((load)=>{
		res.status(200).json(load)
	}).catch((error)=>{
		next(error);
	})
})


app.post('/',(req,res,next)=>{
	validate.isJson(req);
	validate.acceptsJson(req);
	createLoad(req).then((results)=>{
		res.status(201).json(results[0])
	}).catch((error)=>{
		next(error);
	})
})

//can only modify
app.patch('/:load_id',(req,res,next)=>{
	validate.isJson(req);
	validate.acceptsJson(req);
	return patchLoad(req).then((data)=>{
		res.status(200).json(data);		
	}).catch((error)=>{
		next(error);
	})
})


//can only modify, all three parameters required
app.put('/:load_id',(req,res,next)=>{
	validate.isJson(req);
	return patchLoad(req).then((data)=>{
		res.status(204).send();		
	}).catch((error)=>{
		next(error);
	})
})

function is_equal(val1,val2){
	if(val1==val2){
		return true;
		console.log('is_equal returning true')
	}
	return false;
}

//(TYPE1, id1, prop1, TYPE2, prop2)
//delete boat
app.delete('/:load_id',(req,res,next)=>{
	return deleteLoad(req).then(()=>{
		res.status(204).send();
	}).catch((error)=>{
		next(error);
	})
});

/*** CANNOT DELETE ALL BOATS ***/
app.delete('/' , function(req, res){
	res.set("Allow", "GET, POST");
	throw new client.method_not_allowed("DELETE " + req.protocol +"://" + req.get("host") + '/' + 'loads is not an acceptable request');
});

/*** CANNOT patch ALL BOATS ***/
app.patch('/' , function(req, res){
	res.set("Allow", "GET, POST");
	throw new client.method_not_allowed("PATCH " + req.protocol +"://" + req.get("host") + '/' + 'loads is not an acceptable request');
});


/*** CANNOT put ALL BOATS ***/
app.put('/' , function(req, res){
	res.set("Allow", "GET, POST");
	throw new client.method_not_allowed("PUT " + req.protocol +"://" + req.get("host") + '/' + 'loads is not an acceptable request');
});

module.exports=app;