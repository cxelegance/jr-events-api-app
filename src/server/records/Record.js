import RecordTypeError from '../errors/RecordTypeError';

/**
 * Responsible for abstractly defining a Record.
 *
 * @abstract
 * @class
 * @classdesc A Record is an object that can be stored in the database.
 */
export default class Record {

	constructor(record = null){
		if(this.constructor === Record){
			throw new Error('Record is an abstract class and must be extended.');
		}
		if(typeof record == 'object' && record !== null){
			for(const field in record){
				this[field] = record[field];
			}
		}else if(typeof record != 'object'){
			throw new RecordTypeError('a single record should be an object.')
		}

	}

}