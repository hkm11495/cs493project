const express = require('express');
const app = express();
const bodyParser = require('body-parser');

var ds_boat=require('./../app/models/Boat');
var ds_load=require('./../app/models/Load');
var ds_user=require('./../app/models/User');
var ds=require('./../lib/datastore/datastore_functions');
var ds_e=require('./../lib/datastore/datastore_entity');
var jwt=require('./../lib/middleware/checkjwt');
var ds_request=require('./boats_loads');
var client=require('./../lib/error/client_error');
var validate=require('./../lib/validation/json_val');
const verify_jwt=jwt.verify;
const _ds=require('./../lib/datastore/datastore')
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

var date=require('./../lib/helpers/date')
const LOADS='loads';
const LOAD='Load';
const USER='User'
const USERS='Users'



function getUsers(req,callback,callback_params){
	return ds_request.get_entities(USER, req, callback,callback_params,new ds_user.User()).then((results)=>{
		//return results.items.map((user)=>{
			//return user;
		//})
		console.log(results);
		results.items.forEach(item=>{
			if (item.self){
				delete item.self;
			}
		})	
		return results.items;
	})
}


function createUser(req,userid){
	req.body.created_date=date.getDate();
	req.body.sub=userid;
	
	return ds_request.post_entity(req,USER,new ds_user.User()).then((results)=>{
		console.log(results);
		return results[0];
	})
}


//INCLUDE PAGENATION
//INCLUDE PAGENATION
app.get('/',verify_jwt,function(req,res){
	validate.acceptsJson(req);
	var callback=ds.getEntitiesByProperty;
	var callback_params=[[USER],['sub','=',res.locals.userid]];
	if (res.locals.error=='bad jwt'){
		callback=ds.getAll;
		callback_params=[USER]
	}
	return getUsers(req,callback,callback_params).then((results)=>{
		res.status(200).json(results);
	})
})


app.post('/',verify_jwt,(req,res,next)=>{
	if (res.locals.userid){
		validate.isJson(req);
		validate.acceptsJson(req);
		return createUser(req,res.locals.userid).then((results)=>{
			res.status(201).json(results)
		}).catch((error)=>{
			next(error);
		})
	}
	throw new client.unauthorized('Invalid authentication credentials');	
})

module.exports=app;