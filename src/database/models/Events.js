const path = require('path');
import simpleJSONDB from 'simple-json-db';

const dbPath = path.join(__dirname, '..', 'jsonDB/Events.json');
const db = new simpleJSONDB(dbPath, {asyncWrite: true});

/*
 * TODO
 *    - all throws should be an exception type
 *    - database indices are positive, non zero integers wrapped in strings
 *    - methods always return empty array or array of one or more events of the form {id, event}
 */

class EventsModel {
	static schema;
	#bottomID;
	#topID;

	constructor(schemaJSON) {
		this.schema = JSON.parse(schemaJSON);
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
		if(typeof startID == 'number' && typeof endID == 'number'){
			if(startID == endID){
				events = this.#readOne(startID + '');
			}else if(startID > endID){
				throw 'startID should be <= endID';
			}else{
				events = this.#readRange(startID + '', endID + '');
			}
		}else if(!!startID && !!endID){
			events = this.#readRange(this.#bottomID + '', this.#topID);
		}else if(!!startID && !!!endID){
			events = this.#readOne(this.#bottomID + '');
		}else if(!!!startID && !!endID){
			events = this.#readOne(this.#topID + '');
		}else {
			throw 'incorrect parameters sent';
		}
		return events;
	};

	update = (event) => {

	};

	delete = (id) => {

	};

	#readOne = (id) => {
		const event = db.get(id);
		if(!event) return [];
		return [{id, event}];
	}

	#readRange = (bottom, top) => {

	}

	#determineRange = () => {
		const db = db.JSON();
		const indices = Object.keys(db);
		if(indices.length){
			this.#bottomID = parseInt(indices[0], 10);
			this.#topID = parseInt(indices[indices.length - 1]);
		}
	}
}

export {EventsModel as default};