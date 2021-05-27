import Service from './Service';
import EventsRecord from '../records/EventsRecord';

/**
 * Responsible for defining the EventsService.
 *
 * @class
 * @classdesc The EventsService provides Events (plural) operations to a consumer.
 */
export default class EventsService extends Service { // FINAL

	constructor(modelFactory, db, isSecure){
		super(modelFactory, db, isSecure);
		this.modelType = 'Events';
		this.serviceName = 'Events';
		if(this.constructor !== EventsService){
			throw new Error('EventsService is a final class and cannot be extended.');
		}
		this.secureMethods.push('put');
		this.allMethods.push('get', 'put');
		this.isSoftDelete = true;
	}

	/**
	 * Responsible for getting all or a range of EventsRecords.
	 *
	 * @see EventsRecords
	 * @see SuccessServiceResponse
	 * @see ErrorServiceResponse
	 *
	 * @param  {Object} p                   Params are wrapped in this object.
	 * @param  {Number} [p.start=undefined] The starting ID for a range of records.
	 * @param  {Number} [p.end=undefined]   The ending ID for a range of records.
	 *
	 * @return {Promise} The promise resolves with EventsRecords[] in a SuccessServiceResponse, or an ErrorServiceResponse.
	 */
	get({start = undefined, end = undefined}){
		return this.throwIfInsecure('get').then(
			() => this.getModel()
		).then(
			model => model.read(start ? start : 1, end)
		).then(
			data => this.generateSuccess('get', data, {start, end})
		).catch(
			e => this.generateError('get', e, {start, end})
		);
	}

	/**
	 * Responsible for replacing all EventsRecords with a supplied set of records with record ids.
	 *
	 * @param  {Object}         p         Params are wrapped in this object.
	 * @param  {EventsRecord[]} p.records An EventsRecord with proposed fields/values, wrapped in an array.
	 *
	 * @return {Promise} The promise resolves with the record ids in a SuccessServiceResponse, or an ErrorServiceResponse.
	 */
	put({records}){
		return this.performAfterSecurityChecks(
			'put',
			{records},
			() => {
				return Promise.resolve(
				).then(
					() => this.prepareRecords(EventsRecord, records, true)
				).then(
					eventsRecords => records = eventsRecords
				).then(
					() => this.getModel()
				).then(
					model => { // https://github.com/DoctorEvidence/lmdb-store/blob/cb151ba16a2bb679d26c3aebeef3ef3aac4684df/index.js#L985
						model.db.deleteDB(); // https://github.com/DoctorEvidence/lmdb-store/blob/master/src/node-lmdb.h#L641
					}
				).then(
					() => {
						if(this.isSoftDelete){
							records = this.nullStuffRecords(records, 'eventID');
						}
					}
				).then(
					() => this.getModel()
				).then(
					model => {
						const allPromises = [];
						records.forEach(
							rec => allPromises.push(model.create( rec.isNullStuffed ? null : rec, rec.eventID ))
						);
						return Promise.all(allPromises);
					}
				).then(
					data => this.generateSuccess('put', data, {records})
				).catch(
					e => this.generateError('put', e, {records})
				);
			}
		);
	}

}