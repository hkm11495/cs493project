//https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function randomString(){
	var result = [];
	//random length of 10- 20
	length=Math.floor(Math.random()*11)+10;
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result.push(characters.charAt(Math.floor(Math.random() * 
		charactersLength)));
   }
   return result.join('');
}


window.addEventListener('DOMContentLoaded',(event)=>{
	var state=document.getElementById("state")
	state.value=randomString();

	console.log(state.name);
	console.log(state.value);
	
	//create session
	window.sessionStorage.setItem('state', state.value);
})