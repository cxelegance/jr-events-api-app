/*
 * AbstractModel concerns itself simply with validating records based on a supplied schema.
 */

class AbstractModel {
	schema;

	constructor(schema) {
		if(typeof schema != 'object' || schema === null) throw new TypeError('constructor expects schema to be a non-null object');
		const id = {
			type: "Number",
			isRequired: true
		};
		this.schema = { ...schema, id };
	}

	create = record => {this.validateRecord(record);} // sort the array by ID descending
	read = (startID, endID) => {} // array is sorted by ID descending
	update = record => {} // sort the array by ID descending
	delete = id => {}

	validateRecord = record => {
		if(typeof record != 'object' || record == null) throw new TypeError('provided record should be a non-null object');
	}

	// record param should be a property on a maintained object; thus, by reference, it will be altered
	fillDefaults = (record, schema) => {
		for(const [field, rules] of Object.entries(schema)){
			const {type, isRequired, oneOf, defaultVal} = rules;
			console.log(`field ${field}: type is ${type}; isRequired is ${isRequired}; oneOf is ${oneOf};  defaultVal is ${defaultVal}; `);
			console.log(`field is set to: ${record[field]}`);
			if(type === 'Object'){
				if(!record[field] && !isRequired){
					console.log(`skipping field ${field} as it's not in record and not required`);
					continue;
				}else if(!record[field] && isRequired){
					throw new TypeError (`field ${field} should be defined as an object`);
				}else{
					this.fillDefaults(record[field], schema[field]['object']);
				}
			}else if (
				!(typeof defaultVal == 'undefined' || defaultVal === null || Number.isNaN(defaultVal))

				&& (typeof record[field] == 'undefined' || record[field] === null || Number.isNaN(record[field]))
			){
				record[field] = defaultVal;
				console.log(`setting ${field} to be ${defaultVal}`);
			}else{
				console.log(`skipping field ${field}`)
			}
		}
	}
}

export {AbstractModel as default};