//

const express = require('express');
const app = express();
app.enable('trust proxy');
var boats = require('./routes/boats');
var loads = require('./routes/loads');
var login=require('./routes/login');
var users=require('./routes/users');




app.use('/boats', boats);
app.use('/loads', loads);
app.use('/users', users);
app.use('/', login);

app.use((error, req, res, next) => {
	console.log(error);
	res.status(error.status).json({'Error':error})
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});