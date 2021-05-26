const express = require('express');
const app = express();
const bodyParser = require('body-parser');
var jwt=require('./../lib/middleware/checkjwt');
const verify_jwt=jwt.verify;

app.get('/users/:user_id/boats',verify_jwt,(req,res)=>{
	
})