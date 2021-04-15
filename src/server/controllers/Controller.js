import {F500ErrorAPIResponse} from '../responses/ErrorAPIResponse';
import ErrorServiceResponse from '../responses/ErrorServiceResponse';

/**
 * Responsible for creating a new Controller.
 *
 * @class
 * @classdesc An abstract controller for handling HTTP requests intended for a Service.
 *            A Controller receives requests from an HTTPServer and routes them to a Service;
 *            it also receives the completed request from the Service and routes it back to the HTTP Server.
 * @see Service
 * @abstract
 */
export default class Controller {

	/** @type {String} Matches a route to a service, e.g. Event, Events, Auth; defined in inheriting class. */
	serviceRoute;

	/** @type {ServiceFactory} Build a Service to complete a request. */
	serviceFactory;

	/** @type {ServiceToAPIResponseMap} Map a ServiceResponse to an APIResponse. */
	serviceToAPIResponseMap;

	/**
	 * @param {ServiceFactory}          serviceFactory          For setting the internal property of the same name.
	 * @param {ServiceToAPIResponseMap} serviceToAPIResponseMap For setting the internal property of the same name.
	 */
	constructor(serviceFactory, serviceToAPIResponseMap){
		if(this.constructor === Controller){
			throw new Error('Controller is an abstract class and must be extended.');
		}
		this.serviceFactory = serviceFactory;
		this.serviceToAPIResponseMap = serviceToAPIResponseMap;
	}

	/**
	 * Responsible for processing an HTTP request for the service route defined by the inheriting class.
	 *
	 * @param  {String} httpMethod            E.g., GET, POST, PUT, DELETE
	 * @param  {String} httpProtocol          E.g., http, https
	 * @param  {String} [serviceVersion=null] API Service version, e.g., undefined (v1), v2, v3, etc.
	 * @param  {Object} [params={}]           Parameters encapsulated in the request.
	 *
	 * @return {Promise}                      The promise resolves with an APIResponse; it does not intentionally reject; add a catch block for anything unexpected.
	 */
	handleRequest(httpMethod, httpProtocol, serviceVersion = null, params = {}){
		const methodName = httpMethod.toLowerCase();
		if(serviceVersion === null) serviceVersion = undefined;

		return this.serviceFactory.get(
			this.serviceRoute, serviceVersion, httpProtocol.toLowerCase() === 'https'
		).then(
			service => {
				/*
				 * The service's public-facing methods (services) are all of:
				 *    a) public, not private: a private method is expected to fail typeof == 'function'
				 *    b) methods, not properties: a property is expected to fail typeof == 'function'
				 *    c) defined on the service rather than just on a parent:
				 *          service.hasOwnProperty(method) may be false, in which case
				 *             service.constructor.prototype.hasOwnProperty(method) will be true
				 *             service.constructor is the class that the service was instantiated from
				 *                the class must have a prototype object
				 */
				if(
					methodName === 'constructor' ||
					methodName.search(/^[^a-z]/mg) > -1 || // rid of underscore (fake-private methods) and anything else fishy
					typeof service[methodName] != 'function' ||
					(
						methodName != 'options' &&
						!service.hasOwnProperty(methodName) &&
						!service.constructor.prototype.hasOwnProperty(methodName)
					)
				){
					return service.noSuchMethod(methodName);
				}else{
					return service[methodName](params);
				}
			}
		).then(// response may be ErrorServiceResponse or SuccessServiceResponse
			response => this.serviceToAPIResponseMap.get(response)
		).catch( // this is an unexpected error: may be an Error or subclass, but may be anything else
			e => {
				let error = e;
				if(!(e instanceof Error)){
					error = {
						toString: () => { // global: e from above
							const name = typeof e == 'object' && e !== null && typeof e.name == 'string' && e.name;
							const message = typeof e == 'object' && e !== null && typeof e.message == 'string' && e.message;
							return `${name || '<no error name>'}: ${message || e}`;
						}
					};
				}
				return new F500ErrorAPIResponse(
					new ErrorServiceResponse(
						this.serviceRoute, methodName, error, undefined, params
					)
				);
			}
		);
	}

}