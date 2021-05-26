
var ds_ent=require('./../../lib/datastore/datastore_entity')
const DS_Entity=ds_ent.Entity;
/************************
class for entity song:
Contains the following members:
	id, title ,artist, album, saved, duration, date added
*************************/
class User extends DS_Entity{
	//inherits id from parent, obj of keys and values for entity
	constructor(id){
		super(id);
		//string
		this.fname=null;
		this.lname=null;
		this.sub=null;
		this.created_date=null;
	}
	set_params(fname,lname,sub,created_date){
		this.fname=fname;
		this.lname=lname;
		this.sub=sub;
		this.created_date=created_date;
	}
}

module.exports={User};