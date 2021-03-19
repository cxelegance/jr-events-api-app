/**
 * Responsible for creating a new Route.
 *
 * @class
 * @classdesc A Route defines a pattern match and a service name for API routing.
 */
export default class Route {
	/** @type {Object} A RegExp object representing a matching pattern for a route. */
	match;

	/** @type {String} A name for a route. */
	serviceRoute;

	/**
	 * [constructor description]
	 * @param {[type]} match               For setting the internal property of the same name.
	 * @param {[type]} [serviceRoute=null] For setting the internal property of the same name.
	 */
	constructor(match, serviceRoute = null){
		this.match = match;
		this.serviceRoute = serviceRoute;
	}
}