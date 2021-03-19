import Controller from './Controller';

/**
 * Responsible for defining the EventController.
 *
 * @class
 * @classdesc The EventController routes requests on the Event route to the EventService.
 */
export default class EventController extends Controller { // FINAL

	constructor(serviceFactory, serviceToAPIResponseMap){
		super(serviceFactory, serviceToAPIResponseMap);
		this.serviceRoute = 'Event';
		if(this.constructor !== EventController){
			throw new Error('EventController is a final class and cannot be extended.');
		}
	}

}