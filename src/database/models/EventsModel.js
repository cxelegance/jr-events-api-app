import db from '../connect-db';
import AbstractModel from './AbstractModel';

/*
 *    - database indices are positive, non zero integers wrapped in strings
 *    - methods always return empty array or array of one or more events of the form {id, event}
 *    - throws: TypeError for bad params
 */

class EventsModel extends AbstractModel {
	#bottomID;
	#topID;
	#eventWIP;

	constructor(schema) {
		super(schema);
		this.#determineRange();
	}

	create = (event) => {
		if(!this.#topID){
			this.#topID = 0;
			this.#bottomID = 1;
		}
		const nextID = this.#topID + 1;
		this.validateObject(event);
		this.#eventWIP = {...event};
		this.#fillDefaults(this.#eventWIP, this.schema);
		// this.#validate(this.#eventWIP, this.schema);
		db.set(nextID + '', event);
		this.#topID += 1;
		return [{id: nextID, event: db.get(nextID)}];
	};

	// always returns an array of objects or an empty array
	// params: startID, endID
	//    if you want just one, then send the ID twice via startID and endID
	//    if you want a range, then send the start and end ranges via startID and endID
	//    if you want all, then send no parameters
	//    if you want the bottom/oldest event, then send any truthy value as startID and a falsy endID
	//    if you want the top/newest event, then send a falsy value as startDI and a truthy endID
	read = (startID, endID) => {
		let events;
		if(!!!startID && !!!endID){ // two falsy values
			events = this.#readRange(this.#bottomID + '', this.#topID + '');
			console.log(`read: all events, from ID ${this.#bottomID} to ID ${this.#topID}`);
		}else if(!!startID && !!!endID){ // one truthy followed by one falsy value
			events = this.#readOne(this.#bottomID + '');
			console.log(`read: bottom event, ID ${this.#bottomID}`);
		}else if(!!!startID && !!endID){ // one falsy followed by one truthy value
			events = this.#readOne(this.#topID + '');
			console.log(`read: top event, ID ${this.#topID}`);
		}else{ // two truthy values
			if(typeof startID != 'number' || typeof endID != 'number'){
				throw new TypeError('when sending two truthy values, ensure they are both numbers');
			}
			if(startID >= endID){
				events = this.#readOne(startID + '');
				console.log(`read: one event, ID: ${startID}`);
			}else{
				events = this.#readRange(startID + '', endID + '');
				console.log(`read: range events, from ID ${startID} to ID ${endID}`);
			}
		}

		return events;
	};

	update = (event) => {

	};

	// if this throws TypeError or SyntaxError, then there's an issue with the database; see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/delete
	delete = (id) => {
		console.log(`delete: ${id}`);
		if(db.has(id + '') && !db.delete(id + '')){
			throw new TypeError(`database has ID "${id}" but cannot delete it`);
		}
		return [];
	};

	#readOne = (id) => {
		console.log(`readOne: ${id}`);
		const event = db.get(id);
		console.log(`readOne: ${event}`);
		if(!event) return [];
		else return [{id, event}];
	}

	#readRange = (bottom, top) => {
		const dbCopy = db.JSON();
		const indices = Object.keys(dbCopy);
		console.log(`readRange: from ${bottom} to ${top}`);
		return indices.map(
			id => {
				const event = db.get(id);
				return {id, event};
			}
		);
	}

	#determineRange = () => {
		const dbCopy = db.JSON();
		const indices = Object.keys(dbCopy);
		console.log(`determineRange: indices length: ${indices.length}`);
		if(indices.length){
			this.#bottomID = parseInt(indices[0], 10);
			this.#topID = parseInt(indices[indices.length - 1], 10);
		}
		console.log(`determineRange: bottomID: ${this.#bottomID}`);
		console.log(`determineRange: topID: ${this.#topID}`);
	}

	#validate = (event, schema) =>{
		const entries = Object.entries(event);
		for(const [field, rules] of Object.entries(event)){
			if(rules.isRequired && !event[field]){
				throw new TypeError(`${field} is required`);
			}
			if(event[field] && !(event[field] instanceof rules.type)){
				throw new TypeError(`provided ${field} should be of type ${rules.type}`);
			}
			if(rules.oneOf && !rules.oneOf.includes(event[field])){
				throw new TypeError(`provided ${field} should be one of: ${rules.oneOf}`);
			}
			if(typeof rules.type === 'Object'){
				this.#validate(event[field], schema[field]['object']);
			}
		}
	}

	// event param should be a property on a maintained object; thus, by reference, it will be altered
	#fillDefaults = (event, schema) => {
		const entries = Object.entries(event);
		for(const [field, {defaultVal, type}] of Object.entries(event)){
			if(type === 'Object'){
				this.#fillDefaults(event[field], schema[field]['object']);
			}else if (defaultVal && !event[field]){
				event[field] = defaultVal;
			}
		}
	}
}

export {EventsModel as default};