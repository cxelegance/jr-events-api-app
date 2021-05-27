import Service from './Service';
import EventsRecord from '../records/EventsRecord';
import BadParameterError from '../errors/BadParameterError';
import NoRecordsFoundError from '../errors/NoRecordsFoundError';
import RecordExistsError from '../errors/RecordExistsError';
import RecordDeletedError from '../errors/RecordDeletedError';
import SchemaValidationTypeError from '../errors/SchemaValidationTypeError';

/**
 * Responsible for defining the EventService.
 *
 * @class
 * @classdesc The EventService provides Event (singular) operations to a consumer.
 */
export default class EventService extends Service { // FINAL

	constructor(modelFactory, db, isSecure){
		super(modelFactory, db, isSecure);
		this.modelType = 'Events';
		this.serviceName = 'Event';
		if(this.constructor !== EventService){
			throw new Error('EventService is a final class and cannot be extended.');
		}
		this.secureMethods.push('put', 'post', 'delete');
		this.allMethods.push('get', 'put', 'post', 'delete');
		this.isSoftDelete = true;
	}

	/**
	 * Responsible for getting an EventsRecord.
	 *
	 * @see EventsRecord
	 * @see SuccessServiceResponse
	 * @see ErrorServiceResponse
	 * @see Service#throwIfInsecure
	 *
	 * @param  {Object} p    Params are wrapped in this object.
	 * @param  {Number} p.id The ID of the record to obtain.
	 *
	 * @return {Promise} The promise resolves with EventsRecord[] in a SuccessServiceResponse, or an ErrorServiceResponse.
	 */
	get({id}){
		const start = id;
		const end = start;

		return this.performAfterSecurityChecks(
			'get',
			{id},
			() => {
				return Promise.resolve(
				).then(
					() => this.getModel()
				).then(
					model => model.read(start, end)
				).then(
					data => this.generateSuccess('get', data, {id})
				).catch(
					e => this.generateError('get', e, {id})
				);
			}
		);
	}

	/**
	 * Responsible for updating an EventsRecord.
	 *
	 * @see EventsRecord
	 * @see SuccessServiceResponse
	 * @see ErrorServiceResponse
	 * @see Service#throwIfInsecure
	 *
	 * @param  {Object}         p         Params are wrapped in this object.
	 * @param  {EventsRecord[]} p.records An EventsRecord with updated fields, wrapped in an array.
	 * @param  {Number}         p.id      The ID of the event to modify; overrides any ID found p.records.
	 *
	 * @return {Promise} The promise resolves with the updated record ID in a SuccessServiceResponse, or an ErrorServiceResponse.
	 */
	put({records, id}){
		return this.performAfterSecurityChecks(
			'put',
			{records, id},
			() => {
				return Promise.resolve(
				).then(
					() => this.prepareRecords(EventsRecord, records)
				).then(
					eventsRecords => {
						eventsRecords[0].eventID = parseInt(id, 10);
						return this.prepareRecords(EventsRecord, eventsRecords);
					}
				).then(
					eventsRecords => records = eventsRecords
				).then(
					() => this.getModel()
				).then(
					model => model.update(records[0])
				).catch(
					e => {
						if(e instanceof RecordDeletedError) throw new NoRecordsFoundError(`No record found with id ${id}.`);
						throw e;
					}
				).then(
					data => this.generateSuccess('put', data, {records, id})
				).catch(
					e => this.generateError('put', e, {records, id})
				);
			}
		);
	}

	/**
	 * Responsible for creating an EventsRecord.
	 *
	 * @see EventsRecord
	 * @see SuccessServiceResponse
	 * @see ErrorServiceResponse
	 * @see Service#throwIfInsecure
	 *
	 * @param  {Object}         p         Params are wrapped in this object.
	 * @param  {EventsRecord[]} p.records An EventsRecord with proposed fields/values, wrapped in an array.
	 * @param  {Number}         p.id      If either start or id is sent, BadParameterError will be sent.
	 * @param  {Number}         p.start   If either start or id is sent, BadParameterError will be sent.
	 *
	 * @return {Promise} The promise resolves with the new record ID in a SuccessServiceResponse, or an ErrorServiceResponse.
	 */
	post({records, id, start}){
		const badParameterError = new BadParameterError('EventService "post" cannot receive a record ID; do not specify one.');
		return this.performAfterSecurityChecks(
			'post',
			{records, id, start},
			() => {
				return Promise.resolve(
				).then(
					() => {
						if(id || start){
							throw badParameterError;
						}else{ // if records is well defined, we need a dummy eventID to pass prepareRecords(), without using getNextId() prematurely
							try{
								records[0].eventID = 1;
							}catch(e){}
						}
					}
				).then(
					() => this.prepareRecords(EventsRecord, records)
				).then(
					eventsRecords => records = eventsRecords
				).then(
					() => this.getNextId('eventID')
				).then(
					id => records[0].eventID = id
				).then(
					() => this.getModel()
				).then(
					model => model.create(records[0])
				).catch(
					e => {
						if(e instanceof RecordDeletedError) throw new Error(`Soft deleted: trouble saving with newly created ID: ${records[0].eventID}.`);
						if(e instanceof RecordExistsError) throw new Error(`trouble saving with newly created ID: ${records[0].eventID}.`);
						throw e;
					}
				).then(
					id => {
						this.setNextId(id + 1);
						return this.generateSuccess('post', id, {records, id, start});
					}
				).catch(
					e => this.generateError('post', e, {records})
				);
			}
		);
	}

	/**
	 * Responsible for deleting an EventsRecord.
	 *
	 * @see EventsRecord
	 * @see SuccessServiceResponse
	 * @see ErrorServiceResponse
	 * @see Service#throwIfInsecure
	 *
	 * @param  {Object} p    Params are wrapped in this object.
	 * @param  {Number} p.id The ID of the record to delete.
	 *
	 * @return {Promise} The promise resolves with the ID of the deleted record in a SuccessServiceResponse, or an ErrorServiceResponse.
	 */
	delete({id}){
		return this.performAfterSecurityChecks(
			'delete',
			{id},
			() => {
				return Promise.resolve(
				).then(
					() => this.getModel()
				).then(
					model => model.delete(id)
				).catch(
					e => {
						if(e instanceof RecordDeletedError) throw new NoRecordsFoundError(`No record found with id ${id}.`);
						throw e;
					}
				).then(
					data => this.generateSuccess('delete', data, {id})
				).catch(
					e=> this.generateError('delete', e, {id})
				);
			}
		);
	}

}