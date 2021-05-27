import Model from './Model';
import AuthRecord from '../records/AuthRecord';

/**
 * Responsible for defining the AuthModel.
 *
 * @class
 * @classdesc The AuthModel provides CRUD operations for AuthRecords.
 */
export default class AuthModel extends Model {

	/**
	 * Overrides the parent then calls the parent; ensures that record ID is ascertained.
	 *
	 * @see Model#create
	 *
	 * @throws {Error}
	 * @throws {TypeError}
	 */
	create(record, id = null){
		if(this.getSoftDelete() && record === null && id === null){
			throw new Error('create received a null record with no ID');
		}
		if(
			!(record instanceof AuthRecord) &&
			(!this.getSoftDelete() || this.getSoftDelete && record !== null)
		){
			throw new TypeError('record provided is not an AuthRecord.');
		}
		if(id === null && record instanceof AuthRecord) id = record.authID;
		return super.create(record, id);
	}

	/**
	 * Overrides the parent then calls the parent; ensures that record ID is ascertained.
	 *
	 * @see Model#update
	 *
	 * @throws {TypeError}
	 */
	update(record, id = null){
		if(!(record instanceof AuthRecord)) throw new TypeError('record provided is not a AuthRecord.');
		if(id === null) id = record.authID;
		return super.update(record, id);
	}

}