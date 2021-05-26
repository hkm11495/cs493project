var ds_ent=require('./../../lib/datastore/datastore_entity')
const DS_Entity=ds_ent.Entity;
class Boat extends DS_Entity{
	//inherits id from parent, obj of keys and values for entity
	constructor(id){
		super(id);
		this.name=null;
		this.type=null;
		this.length=null;
		this.owner=null;
		this.loads=null;
	}
	set_params(name,type,length,owner,load){
		this.name=name;
		this.type=type ;
		this.length=length;
		this.owner=owner;
		this.loads=load;
	}
}

module.exports={Boat};