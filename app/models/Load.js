var ds_ent=require('./../../lib/datastore/datastore_entity');
const DS_Entity=ds_ent.Entity;
class Load extends DS_Entity{
	//inherits id from parent, obj of keys and values for entity
	constructor(id){
		super(id);
		this.volume=null;
		this.carrier=null;
		this.content=null;
		this.creation_date=null;
	}
	set_params(volume, carrier, content, creation_date){
		this.volume=volume;
		this.carrier=carrier ;
		this.content=content;
		this.creation_date=creation_date;
	}
}

module.exports={Load};