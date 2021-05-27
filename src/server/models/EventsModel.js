import Model from './Model';
import EventsRecord from '../records/EventsRecord';

/**
 * Responsible for defining the EventsModel.
 *
 * @class
 * @classdesc The EventsModel provides CRUD operations for EventRecords.
 */
export default class EventsModel extends Model {

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
			!(record instanceof EventsRecord) &&
			(!this.getSoftDelete() || this.getSoftDelete && record !== null)
		){
			throw new TypeError('record provided is not an EventsRecord');
		}
		if(id === null && record instanceof EventsRecord) id = record.eventID;
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
		if(!(record instanceof EventsRecord)) throw new TypeError('record provided is not an EventsRecord.');
		if(id === null) id = record.eventID;
		return super.update(record, id);
	}

}