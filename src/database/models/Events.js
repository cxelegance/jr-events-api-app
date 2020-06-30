import db from '../connect-db';

/*
 *    - database indices are positive, non zero integers wrapped in strings
 *    - methods always return empty array or array of one or more events of the form {id, event}
 *    - throws: TypeError for bad params
 */

class EventsModel {
	static schema;
	#bottomID;
	#topID;

	constructor(schema) {
		this.schema = schema;
		if(typeof schema != 'object' || schema === null) throw new TypeError('constructor expects schema to be a non-null object');
		this.#determineRange();
	}

	create = (event) => {

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
			events = this.#readRange(this.#bottomID + '', this.#topID);
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

	delete = (id) => {

	};

	#readOne = (id) => {
		console.log(`readOne: ${id}`);
		const event = db.get(id);
		console.log(`readOne: ${event}`);
		if(!event) return [];
		else return [{id, event}];
	}

	#readRange = (bottom, top) => {

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
}

export {EventsModel as default};