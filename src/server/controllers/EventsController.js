import Controller from './Controller';

/**
 * Responsible for defining the EventsController.
 *
 * @class
 * @classdesc The EventsController routes requests on the Events route to the EventsService.
 */
export default class EventsController extends Controller { // FINAL

	constructor(serviceFactory, serviceToAPIResponseMap){
		super(serviceFactory, serviceToAPIResponseMap);
		this.serviceRoute = 'Events';
		if(this.constructor !== EventsController){
			throw new Error('EventsController is a final class and cannot be extended.');
		}
	}

}