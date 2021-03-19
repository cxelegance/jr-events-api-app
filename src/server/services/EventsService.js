import Service from './Service';

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
		this.allMethods.push('get');
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

}