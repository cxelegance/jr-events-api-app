import db from '../connect-db';
import AbstractModel from './AbstractModel';

/*
 *    - database indices are positive, non zero integers wrapped in strings
 *    - methods always return empty array or array of one or more events of the form {id, event}
 *    - throws: TypeError for bad params, Error for database Errors
 */

class EventsModel extends AbstractModel {
	#bottomID;
	#topID;
	#eventWIP;
	#idMap;

	constructor(schema) {
		super(schema);
		this.tableName = 'events';
		this.#buildIdMap();
	}

	create = (event) => {
		let events = db.get(this.tableName) || [];
		const id = (this.#idMap[this.#idMap.length - 1] || 0) + 1; // event IDs are positive, non-zero integers.
		this.validateRecord(event);
		this.#eventWIP = {...event, id};
		this.fillDefaults(this.#eventWIP, this.schema);
		// this.#validate(this.#eventWIP, this.schema)
		event = {...this.#eventWIP};
		events.push(event);
		db.set(this.tableName, events);
		this.#idMap.push(id);
		return new Promise(
			(resolve, reject) => {
				db.sync().then(
					() => {
						resolve([event]);
					}
				).catch(
					e => {
						throw new Error(e);
					}
				);
			}
		);
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
		let events = db.get(this.tableName) || [];
		const index = this.#idMap.indexOf(id);
		return new Promise(
			(resolve, reject) => {
				if(index > -1){
					events.splice(index, 1);
					this.#idMap.splice(index, 1);
					db.sync().then( () => resolve([]) );
				}else{
					resolve( [] );
				}
			}
		);
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

	#buildIdMap = () => {
		const records = db.get(this.tableName);
		if(!records) this.#idMap = [];
		else this.#idMap = records.map(
			record => record.id
		);
		console.log(`idMap: ${this.#idMap}`);
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

}

export {EventsModel as default};