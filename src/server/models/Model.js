import RecordExistsError from '../errors/RecordExistsError';
import NoRecordsFoundError from '../errors/NoRecordsFoundError';
import BadRangeError from '../errors/BadRangeError';

/**
 * Responsible for abstractly defining a Model.
 *
 * @abstract
 * @class
 * @classdesc A Model provides CRUD operations for a table in the database.
 */
export default class Model {
	/** @type {Schema} An instance of Schema that describes a table in the database. */
	schema;

	/** @type {Object} Provides CRUD-like methods for the database containing the corresponding table. */
	db;

	/**
	 * @param {Schema} schema An instance of Schema that describes a table in the database.
	 * @param {Object} db     Provides CRUD-like methods for the database containing the corresponding table.
	 */
	constructor(schema, db){
		if(this.constructor === Model){
			throw new Error('Model is an abstract class and must be extended.');
		}
		this.schema = schema;
		this.db = db;
	}

	/**
	 * Responsible for creating a new record.
	 *
	 * @param  {Record} record    A valid Record object.
	 * @param  {Number} [id=null] An optional ID; the ID can be ascertained from the Record object in the inheriting class.
	 *
	 * @return {Promise}          Resolves with the record ID; rejects with a RecordExistsError.
	 */
	create(record, id = null){
		this.schema.validateRecord(record);
		return new Promise(
			(resolve, reject) => {
				if(this.db.get(id) !== undefined) reject(new RecordExistsError(`A record already exists with id ${id}.`));
				else{
					this.db.put(id, record).then(
						isPut => {
							if(!isPut) reject(new Error(`Database failed to create record with id ${id}`));
							else resolve(id);
						}
					).catch(
						e => reject(e)
					);
				}
			}
		);
	}

	/**
	 * Responsible for reading a record or a range of records.
	 *
	 * @param  {Number} start      The ID of the record or the starting ID for a range of records.
	 * @param  {Number} [end=null] The ending ID for a range of records.
	 *
	 * @throws TypeError
	 * @throws BadRangeError
	 *
	 * @return {Promise}           Resolves with Records[]; rejects with NoRecordsFoundError.
	 */
	read(start, end = null){
		const out = [];
		let inclusiveEnd;
		if(end === null) end = undefined;
		if(typeof start != 'number') throw new TypeError('read() expects start to be a number.');
		if(end !== undefined && typeof end != 'number') throw new TypeError('read() expects end to be a number.');
		if(typeof end == 'number'){
			if(end < start) throw new BadRangeError('start cannot be greater than end.');
			inclusiveEnd = end + 1;
		}
		return new Promise(
			(resolve, reject) => {
				this.db.getRange(
					{start, end: inclusiveEnd || end}
				).filter(
					({key, value}) => value !== undefined
				).forEach(
					({value}) => out.push(value)
				);
				if(!out.length) reject(new NoRecordsFoundError(`No records found for start = ${start} and end = ${end}.`));
				else resolve(out);
			}
		);
	}

	/**
	 * Responsible for updating an existing record.
	 *
	 * @param  {Record} record    A valid Record object.
	 * @param  {Number} [id=null] An optional ID; the ID can be ascertained from the Record object in the inheriting class.
	 *
	 * @return {Promise}          Resolves with the record ID; rejects with NoRecordsFoundError.
	 */
	update(record, id = null){
		this.schema.validateRecord(record);
		return new Promise(
			(resolve, reject) => {
				if(this.db.get(id) === undefined) reject(new NoRecordsFoundError(`No record found with id ${id}.`));
				else{
					this.db.put(id, record).then(
						isPut => {
							if(!isPut) reject(new Error(`Database failed to update record with id ${id}.`));
							else resolve(id);
						}
					).catch(
						e => reject(e)
					);
				}
			}
		);
	}

	/**
	 * Responsible for deleting a record.
	 *
	 * @param  {Number} id The ID of the record to delete.
	 *
	 * @return {Promise}   Resolves with the record ID; rejects with NoRecordsFoundError or Error.
	 */
	delete(id){
		return new Promise(
			(resolve, reject) => {
				if(this.db.get(id) === undefined) reject(new NoRecordsFoundError(`No record found with id ${id}.`));
				else{
					this.db.remove(id).then(
						isDeleted => {
							if(!isDeleted) reject(new Error(`Database failed to delete record with id ${id}.`));
							else resolve(id);
						}
					).catch(
						e => reject(e)
					);
				}
			}
		);
	}
}

