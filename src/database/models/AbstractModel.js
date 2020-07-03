class AbstractModel {
	schema;

	constructor(schema) {
		if(typeof schema != 'object' || schema === null) throw new TypeError('constructor expects schema to be a non-null object');
		this.schema = schema;
	}

	create = record => {this.validateObject(record);}
	read = (startID, endID) => {}
	update = record => {}
	delete = id => {}

	validateObject = record => {
		if(typeof record != 'object' || record == null) throw new TypeError('provided record should be a non-null object');
	}
}

export {AbstractModel as default};