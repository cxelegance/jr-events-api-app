import RecordExistsError from '../errors/RecordExistsError';
import RecordDeletedError from '../errors/RecordDeletedError';
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

	/** @type {Boolean} True for soft deletion, i.e., record is NULL, or false for real deletion. */
	#isSoftDelete;

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
		this.#isSoftDelete = false;
	}

	/**
	 * Responsible for creating a new record.
	 *
	 * @param  {Record} record    A valid Record object.
	 * @param  {Number} [id=null] An optional ID; the ID can be ascertained from the Record object in the inheriting class.
	 *
	 * @return {Promise}          Resolves with the record ID; rejects with a RecordExistsError or RecordDeletedError.
	 */
	create(record, id = null){
		if(!this.#isSoftDelete || record !== null) this.schema.validateRecord(record);
		return new Promise(
			(resolve, reject) => {
				if(this.#isSoftDelete && this.db.get(id) === null) reject(new RecordDeletedError(`A soft-deleted record already exists with id ${id}.`));
				else if(this.db.get(id) !== undefined) reject(new RecordExistsError(`A record already exists with id ${id}.`));
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
	 * @throws {TypeError}
	 * @throws {BadRangeError}
	 *
	 * @return {Promise}           Resolves with Records[]; rejects with NoRecordsFoundError.
	 */
	read(start, end = null){
		const out = [];
		let inclusiveEnd, hasEncounteredNull = false;
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
					{start, end: inclusiveEnd}
				).filter(
					({key, value}) => {
						hasEncounteredNull = hasEncounteredNull || (this.#isSoftDelete && value === null);
						return value !== undefined && (!this.#isSoftDelete || value !== null);
					}
				).forEach(
					({value}) => out.push(value)
				);
				if(!out.length && inclusiveEnd && inclusiveEnd - start === 1 && hasEncounteredNull){
					reject(new RecordDeletedError(`Record has been soft deleted; id: ${start}.`));
				}else if(!out.length){
					reject(new NoRecordsFoundError(`No records found for start = ${start} and end = ${end}.`));
				}else{
					resolve(out);
				}
			}
		);
	}

	/**
	 * Responsible for updating an existing record.
	 *
	 * @param  {Record} record    A valid Record object.
	 * @param  {Number} [id=null] An optional ID; the ID can be ascertained from the Record object in the inheriting class.
	 *
	 * @return {Promise}          Resolves with the record ID; rejects with NoRecordsFoundError or RecordDeletedError.
	 */
	update(record, id = null){
		if(!this.#isSoftDelete || record !== null) this.schema.validateRecord(record);
		return new Promise(
			(resolve, reject) => {
				if(this.#isSoftDelete && this.db.get(id) === null) reject(new RecordDeletedError(`Record has been soft deleted; id: ${id}.`));
				else if(this.db.get(id) === undefined) reject(new NoRecordsFoundError(`No record found with id ${id}.`));
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
				if(this.#isSoftDelete && this.db.get(id) === null) reject(new RecordDeletedError(`Record has already been soft deleted; id: ${id}.`));
				else if(this.db.get(id) === undefined) reject(new NoRecordsFoundError(`No record found with id ${id}.`));
				else if(this.#isSoftDelete){
					this.db.put(id, null).then(
						isPut => {
							if(!isPut) reject(new Error(`Database failed to soft delete record with id ${id}.`));
							else resolve(id);
						}
					).catch(
						e => reject(e)
					);
				}else{
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

	/**
	 * Responsible for setting private property #isSoftDelete.
	 *
	 * @param {Boolean} [isSoftDelete=false] Set to true for soft deletion of records by way of setting to null; false is default.
	 *
	 * @see #isSoftDelete
	 *
	 * @return void
	 */
	setSoftDelete(isSoftDelete = false){
		if(typeof isSoftDelete != 'boolean') throw new TypeError(`setSoftDelete expects a boolean; received: ${isSoftDelete}`);
		this.#isSoftDelete = isSoftDelete;
	}

	/**
	 * Responsible for getting private property #isSoftDelete.
	 *
	 * @see #isSoftDelete
	 *
	 * @return {Boolean}
	 */
	getSoftDelete(){
		return this.#isSoftDelete;
	}

	/**
	 * Responsible for getting the most recent/top record from the database.
	 *
	 * @return {Promise} Resolves with Records[] (only one record); rejects with NoRecordsFoundError or
	 *                   RecordDeletedError (in the latter case, error.message == '<key of soft-deleted record>'
	 */
	getMostRecent(){
		return new Promise(
			(resolve, reject) => {
				const out = [];
				this.db.getRange(
					{reverse: true, limit: 1}
				).forEach(
					({key, value}) => {
						if(this.#isSoftDelete && value === null) out.push(key)
						else out.push(value);
					}
				);
				if(!out.length){
					reject(new NoRecordsFoundError(`Cannot get most recent record; no records found.`));
				}else if(out.length > 1){
					reject(new Error('getMostRecent would return more than one record.'));
				}else if(this.#isSoftDelete && typeof out[0] == 'number'){
					reject(new RecordDeletedError('' + out[0]));
				}else{
					resolve(out);
				}
			}
		);
	}
}

