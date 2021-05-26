const express = require('express');
const app = express();
var path=require('path');
var newState=require('./../lib/middleware/generate_state');
const request=require('request');
var session = require('express-session');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, '/../public')));
var dotenv = require('dotenv');
dotenv.config();

app.use(session({
	secret: 'a_secret_key',
	resave:true,
	saveUninitialized:true
	}));

function get_request(req,data, render_info){
	var auth_req={
		url:process.env.AUTH0_USER_PROFILE,
		headers:{
			Authorization: data.token_type + ' ' + data.access_token
		}
	}
	console.log(auth_req);
	request.get(auth_req,(err, httpResponse,body)=>{
	if(err){
			console.log(err)
			return;
		}
		console.log(body);
		var response={
			name:JSON.parse(body).names[0].displayName,
			id: JSON.parse(body).names[0].metadata.source.id,
			token_type: data.token_type,
			id_token: data.id_token,
			state: req.session.state
		}
		render_info(response);
		return;
	});
}

function post_request(req, render_info){
	const form_data={
			code:req.query.code,
			client_id:process.env.AUTH0_CLIENT_ID,
			client_secret:process.env.AUTH0_CLIENT_SECRET,
			redirect_uri:process.env.AUTH0_CALLBACK_URL,
			grant_type:'authorization_code'
		
	};
	request.post({url:"https://oauth2.googleapis.com/token",form:form_data}, (err, httpResponse,body)=>{
		if (err){
			console.log(err);
			return;
		}
		console.log(body);
		var results=JSON.parse(body);
		get_request(req,results, render_info);
		return;
	});
	return;
}

var scopes=['profile'];
app.get('/' , function(req, res){
	var data={
		'response_type':'code',
		'redirect_uri':process.env.AUTH0_CALLBACK_URL,
		'scope':'profile',
		'state':newState.newState(),
		'client_id':process.env.AUTH0_CLIENT_ID
	}
	console.log(data);
	res.render('welcome',{data:data})

});

app.get('/oauth' , function(req, res){

	post_request(req,function(user_info){
		res.render('user_info',{data:user_info});
	});
	
});

module.exports=app;