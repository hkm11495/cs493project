

var ds=require('./../lib/datastore/datastore_functions');
var ds_e=require('./../lib/datastore/datastore_entity');
var client=require('./../lib/error/client_error')

const datastore=ds.datastore;
const arr=require('./../lib/helpers/arrays')
const isArray=arr.is_Array;

function get_entities(TYPE,req,callback,q, class_obj){
	return ds.pagination(TYPE,req,callback,q).then((results)=>{
		console.log(q);
		results.items=ds.map_all_properties(results.items,class_obj,req);
		return results;
	})
}


//(post_entity(req,BOAT, ds_entity.Boat())
function post_entity(req,TYPE,class_obj){
	var obj=req.body;
	return ds.createEntity(TYPE,obj).then((results)=>{
		results=ds.map_all_properties([results],class_obj,req);
		return results;
	})
}


//(req, BOAT,ds_entity.Boat())
function patch_entity(TYPE,req_body,queries,err){
	var q1=ds.getEntitiesByProperties(TYPE,queries);
	return ds.query(q1).then((results1)=>{
		var obj=results1[0];
		if(obj[0]){
			Object.keys(req_body).map((key)=>{
				obj[0][key]=req_body[key];
			});
			return ds.updateEntity(obj[0]).then(()=>{
				return ds.query(q1).then((data)=>{
					return data[0];
				})
			})	
		}
		throw err;
	})
}




//removeEntity(ds.getEntitiesByProperties,
//[BOAT,[['__key__', '=', datastore.key(['Boat', parseInt(req.params.boat_id,10)])],['owner','=',userid]]], 
//ds.getEntitybyid,[id,type],)




//sets a property of an object to null by querying by id;
function make_prop_null(type,item,prop){
	console.log('getting entity by id: ' + item);
	return ds.getEntityByID(type,parseInt(item,10)).then((obj)=>{
		if (obj){
			obj[prop]=null;
			return ds.updateEntity(obj);
		}
	})	
}

//callback for removing value by condition
function removeFromEntityArray(array,type,prop,callback,callback_val,err){
	console.log(array);
	for (var i=0;i<array.length;i++){
		var item=array[i];
		if (callback != null){
			if (callback(item,callback_val)){
				return make_prop_null(type,item,prop).then(()=>{
					return i;
				});
			}
		}
		else{
			return make_prop_null(type,item,prop)
		}
	}
	if(callback != null){
		throw err;
	}
}






//first is prop with array, second is prop without array
function addToEntity(q1,type1,prop1,val1, q2,type2,prop2,val2,err){
	var query1=ds.getEntitiesByProperties(type1, q1);
	var query2=ds.getEntitiesByProperties(type2,q2);
	return ds.query(query1).then((data1)=>{
		var b=data1[0];
		if(b[0]){
			var obj1=b[0];
			return ds.query(query2).then((data2)=>{
				l=data2[0];
				if(l[0]){
					if(l[0].carriers!=null){
						err.detail=type2 + ' ' + val2 + ' is already assigned';
						throw err;
					}
					var obj2=l[0];

					if (isArray(obj1[prop1]) && !obj1[prop1].includes(val2)){
					
						obj1[prop1].push(val2);	
					}
					else if(obj1[prop1]==null){
					
						obj1[prop1]=[val2]
					}
					else{
						err.detail=type2 +' ' + val2 + ' is already assigned';
						throw err;
					}
					obj2[prop2]=val1;
				
					return ds.updateEntity(obj1).then(()=>{
						return ds.updateEntity(obj2);
					});
				}
				else{
					throw err;
				}
			})
		}
		else{
			throw err;
		}
	})
}


module.exports={get_entities,post_entity,patch_entity,addToEntity,removeFromEntityArray,make_prop_null};